export const runtime = 'nodejs';

import 'postman-request';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { logPaymentEvent } from '@/app/lib/logPaymentEvent';

const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY    || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri:       process.env.IYZICO_BASE_URL   || '',
});

const BLOCKING_STATUSES = ['Hazırlanıyor', 'Kirada'];

function parseDBPrice(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const cleaned = raw.trim()
      .replace(/TL.*$/i, '')
      .trim()
      .replace(/\./g, '')
      .replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export type PaymentResult = 'success' | 'already_processed' | 'failed' | 'error';

export interface ProcessPaymentOptions {
  source?: 'callback' | 'webhook';
  ip?: string;
}

/**
 * Shared payment processing logic used by both /callback and /webhook.
 * Returns:
 *   'success'           — order created
 *   'already_processed' — duplicate callback/webhook, order already exists
 *   'failed'            — payment not successful or validation error
 *   'error'             — internal error (DB, RPC, etc.)
 */
export async function processPayment(token: string, options: ProcessPaymentOptions = {}): Promise<PaymentResult> {
  const ctx: { errorMsg?: string; conversationId?: string } = {};
  const result = await _processPayment(token, ctx);

  // Fire-and-forget — logging never blocks or crashes the main flow
  logPaymentEvent({
    event_type:      options.source ?? 'callback',
    token,
    conversation_id: ctx.conversationId,
    result,
    error_msg:       ctx.errorMsg,
    ip:              options.ip,
  }).catch((e) => console.error('[processPayment] log hatası:', e));

  return result;
}

async function _processPayment(token: string, ctx: { errorMsg?: string; conversationId?: string }): Promise<PaymentResult> {
  try {
    // 1. Verify payment with Iyzico — single source of truth
    const iyzicoResult = await new Promise<{
      status?: string;
      paymentStatus?: string;
      paidPrice?: string;
      errorCode?: string;
      errorMessage?: string;
      [k: string]: unknown;
    }>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(
        { locale: Iyzipay.LOCALE.TR, token },
        (err: Error | null, res: unknown) => {
          if (err) return reject(err);
          resolve(res as typeof iyzicoResult);
        }
      );
    });

    console.log('[processPayment] token=%s status=%s paymentStatus=%s paidPrice=%s errorCode=%s',
      token.slice(0, 12) + '...',
      iyzicoResult.status,
      iyzicoResult.paymentStatus,
      iyzicoResult.paidPrice,
      iyzicoResult.errorCode,
    );

    if (iyzicoResult.status !== 'success' || iyzicoResult.paymentStatus !== 'SUCCESS') {
      ctx.errorMsg = 'Iyzico: status=' + iyzicoResult.status + ' paymentStatus=' + iyzicoResult.paymentStatus + (iyzicoResult.errorCode ? ' errorCode=' + iyzicoResult.errorCode : '') + (iyzicoResult.errorMessage ? ' msg=' + iyzicoResult.errorMessage : '');
      return 'failed';
    }

    const paidPrice = parseFloat(iyzicoResult.paidPrice ?? '0');
    if (!Number.isFinite(paidPrice) || paidPrice <= 0) {
      console.log('[processPayment] geçersiz paidPrice=%s', iyzicoResult.paidPrice);
      ctx.errorMsg = 'Geçersiz paidPrice: ' + iyzicoResult.paidPrice;
      return 'failed';
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // 2. Atomic claim by token — processed=false guard prevents double-processing
    const { data: claimedRows, error: claimError } = await supabase
      .from('payment_sessions')
      .update({ processed: true })
      .eq('iyzico_token', token)
      .eq('processed', false)   // atomic idempotency guard — never remove
      .gt('expires_at', now)    // expiration guard — never remove
      .select('*');

    if (claimError) {
      console.error('[processPayment] session claim hatası:', claimError.message);
      ctx.errorMsg = 'Session claim hatası: ' + claimError.message;
      return 'error';
    }

    if (!claimedRows || claimedRows.length === 0) {
      // Not found, expired, or already processed
      const { data: existing } = await supabase
        .from('payment_sessions')
        .select('processed')
        .eq('iyzico_token', token)
        .single();

      if (existing?.processed === true) {
        return 'already_processed';
      }
      console.log('[processPayment] session bulunamadı veya süresi dolmuş, token=%s', token.slice(0, 12) + '...');
      ctx.errorMsg = 'Session bulunamadı veya süresi dolmuş';
      return 'failed';
    }

    const session = claimedRows[0];
    const conversationId: string = session.conversation_id;
    ctx.conversationId = conversationId;

    // 3. Strict price validation — cent comparison avoids float imprecision
    const expectedPrice = Number(session.total_price);
    if (Math.round(paidPrice * 100) < Math.round(expectedPrice * 100)) {
      console.error('[processPayment] eksik ödeme: ödenen=%s beklenen=%s conversation=%s',
        paidPrice, expectedPrice, conversationId);
      ctx.errorMsg = 'Eksik ödeme: ödenen=' + paidPrice + ' beklenen=' + expectedPrice;
      return 'failed';
    }

    // 4. Re-fetch product data from DB — prices never come from the session cart
    const cartItems: Array<{ productId: string; color: string; size: string; date: string }> =
      session.cart_items;
    const customer: { firstName: string; lastName: string; phone: string; email: string } =
      session.customer;
    const shippingAddress: { address: string; district: string; city: string; postalCode: string } =
      session.shipping_address;

    const productIdNumbers = [
      ...new Set(
        cartItems
          .map(i => parseInt(i.productId.split('_')[0], 10))
          .filter(n => !isNaN(n) && n > 0)
      ),
    ];

    const { data: products } = await supabase
      .from('urunler')
      .select('id, price, title')
      .in('id', productIdNumbers);

    const productMap = new Map<number, { price: number; title: string }>();
    for (const p of products ?? []) {
      productMap.set(p.id, { price: parseDBPrice(p.price), title: p.title ?? '' });
    }

    // 5. Conflict check — re-run to catch races since /create
    for (const item of cartItems) {
      const id = parseInt(item.productId.split('_')[0], 10);
      const product = productMap.get(id);
      if (!product) continue;

      const date = new Date(item.date);
      const start = new Date(date);
      start.setDate(start.getDate() - 7);
      const end = new Date(date);
      end.setDate(end.getDate() + 7);

      const { data: conflicts } = await supabase
        .from('orders_items')
        .select('id')
        .eq('product_name', product.title)
        .in('status', BLOCKING_STATUSES)
        .gte('event_date', start.toISOString().split('T')[0])
        .lte('event_date', end.toISOString().split('T')[0]);

      if (conflicts && conflicts.length > 0) {
        console.error('[processPayment] çakışma: "%s" conversation=%s', product.title, conversationId);
        ctx.errorMsg = 'Tarih çakışması: ' + product.title;
        return 'failed';
      }
    }

    // 6. Dedup guard — catches duplicates even if atomic claim is somehow bypassed
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (existingOrder) {
      return 'already_processed';
    }

    // 7. Build order — prices always from DB
    const customerName = `${customer.firstName} ${customer.lastName}`.trim();
    const fullAddress = [
      shippingAddress.address,
      shippingAddress.district,
      shippingAddress.city,
      shippingAddress.postalCode,
    ].filter(Boolean).join(', ');

    const orderItems = cartItems
      .map(item => {
        const id = parseInt(item.productId.split('_')[0], 10);
        const product = productMap.get(id);
        if (!product) return null;
        return {
          product_name: product.title,
          color: item.color,
          size: item.size,
          event_date: item.date,
          price: product.price,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (orderItems.length === 0) {
      console.error('[processPayment] ürün verisi eksik, conversation=%s', conversationId);
      ctx.errorMsg = 'Ürün verisi eksik';
      return 'error';
    }

    // 8. Atomic create via RPC — UNIQUE(conversation_id) is the final race guard
    const { error: rpcError } = await supabase.rpc('create_confirmed_order', {
      p_conversation_id: conversationId,
      p_customer_name:   customerName,
      p_phone:           customer.phone,
      p_email:           customer.email ?? null,
      p_address:         fullAddress,
      p_payment_method:  'Online - Iyzico HPP',
      p_shipping_cost:   Number(session.shipping_cost),
      p_total_price:     expectedPrice,
      p_items:           orderItems,
    });

    if (rpcError) {
      if (rpcError.code === '23505') {
        // Unique violation: concurrent callback/webhook already created the order
        return 'already_processed';
      }
      console.error('[processPayment] sipariş oluşturma hatası:', rpcError.message);
      ctx.errorMsg = 'RPC hatası: ' + rpcError.message;
      return 'error';
    }

    console.log('[processPayment] sipariş oluşturuldu, conversation=%s', conversationId);
    return 'success';
  } catch (err) {
    console.error('[processPayment] beklenmeyen hata:', err);
    ctx.errorMsg = err instanceof Error ? err.message : 'Beklenmeyen hata';
    return 'error';
  }
}
