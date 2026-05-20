export const runtime = 'nodejs';

import 'postman-request';
import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { logPaymentEvent } from '@/app/lib/logPaymentEvent';
import { BLOCKING_STATUSES, getConflictDateRange } from '@/app/lib/conflictUtils';
import { iyzipayClient, iyzipayLocale } from '@/app/lib/iyzipayClient';


async function sendAdminOrderNotification(params: {
  conversationId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  totalPrice: number;
  shippingCost: number;
  items: Array<{ product_name: string; color: string; size: string; event_date: string; price: number }>;
}) {
  const { conversationId, customerName, phone, email, address, totalPrice, shippingCost, items } = params;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;color:#333;">${item.product_name}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">${item.color} / Beden ${item.size}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">${formatDate(item.event_date)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;color:#333;text-align:right;">${item.price.toLocaleString('tr-TR')} TL</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f5f5f5;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:30px 20px;">
          <table style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
            <tr>
              <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:25px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:300;letter-spacing:3px;font-style:italic;">MERYEM BALKAN</h1>
                <p style="margin:6px 0 0;color:#d4af37;font-size:11px;letter-spacing:2px;">YENİ SİPARİŞ BİLDİRİMİ</p>
              </td>
            </tr>
            <tr>
              <td style="padding:35px 40px;">

                <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:20px;font-weight:500;">
                  Yeni bir sipariş geldi!
                </h2>

                <!-- Müşteri bilgileri -->
                <div style="background:#f8f9fa;border-radius:8px;padding:18px 20px;margin-bottom:20px;">
                  <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #d4af37;padding-bottom:8px;">
                    Müşteri Bilgileri
                  </h3>
                  <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <tr><td style="padding:5px 0;color:#666;width:35%;">Ad Soyad:</td><td style="padding:5px 0;color:#333;font-weight:500;">${customerName}</td></tr>
                    <tr><td style="padding:5px 0;color:#666;">Telefon:</td><td style="padding:5px 0;color:#333;">${phone}</td></tr>
                    <tr><td style="padding:5px 0;color:#666;">E-posta:</td><td style="padding:5px 0;color:#333;">${email}</td></tr>
                    <tr><td style="padding:5px 0;color:#666;">Adres:</td><td style="padding:5px 0;color:#333;">${address}</td></tr>
                    <tr><td style="padding:5px 0;color:#666;">Iyzico Conversation ID:</td><td style="padding:5px 0;color:#333;font-family:monospace;font-size:12px;">${conversationId}</td></tr>
                  </table>
                </div>

                <!-- Ürünler -->
                <div style="background:#f8f9fa;border-radius:8px;padding:18px 20px;margin-bottom:20px;">
                  <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #d4af37;padding-bottom:8px;">
                    Sipariş Edilen Ürünler
                  </h3>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                      <tr style="background:#e9ecef;">
                        <th style="padding:8px 10px;text-align:left;color:#555;font-weight:600;">Ürün</th>
                        <th style="padding:8px 10px;text-align:left;color:#555;font-weight:600;">Renk / Beden</th>
                        <th style="padding:8px 10px;text-align:left;color:#555;font-weight:600;">Etkinlik Tarihi</th>
                        <th style="padding:8px 10px;text-align:right;color:#555;font-weight:600;">Fiyat</th>
                      </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                  </table>
                </div>

                <!-- Ödeme özeti -->
                <div style="background:#1a1a2e;border-radius:8px;padding:18px 20px;">
                  <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    ${shippingCost > 0 ? `
                    <tr>
                      <td style="padding:5px 0;color:#aaa;">Ara toplam:</td>
                      <td style="padding:5px 0;color:#ddd;text-align:right;">${(totalPrice - shippingCost).toLocaleString('tr-TR')} TL</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;color:#aaa;">Kargo:</td>
                      <td style="padding:5px 0;color:#ddd;text-align:right;">${shippingCost.toLocaleString('tr-TR')} TL</td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:12px 0 0;color:#d4af37;font-size:16px;font-weight:600;">Toplam Ödenen:</td>
                      <td style="padding:12px 0 0;color:#d4af37;font-size:16px;font-weight:600;text-align:right;">${totalPrice.toLocaleString('tr-TR')} TL</td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>
            <tr>
              <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                <p style="margin:0;color:#999;font-size:12px;">© ${new Date().getFullYear()} Meryem Balkan Tasarım Atölyesi</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail) throw new Error('EMAIL_USER env var tanımlı değil');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: adminEmail,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Meryem Balkan" <${adminEmail}>`,
    to: adminEmail,
    subject: `Yeni Sipariş – ${customerName} (${items.map(i => i.product_name).join(', ')})`,
    html,
  });
}


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
      iyzipayClient.checkoutForm.retrieve(
        { locale: iyzipayLocale, token },
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

      const { startDate, endDate } = getConflictDateRange(item.date);

      const { data: conflicts } = await supabase
        .from('orders_items')
        .select('id')
        .eq('product_name', product.title)
        .in('status', BLOCKING_STATUSES)
        .gte('event_date', startDate)
        .lte('event_date', endDate);

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
      if (rpcError.message?.startsWith('conflict:')) {
        // Advisory lock içinde yakalanan race condition — ödeme başarılı ama tarih doldu
        console.error('[processPayment] RPC çakışma:', rpcError.message, 'conversation=', conversationId);
        ctx.errorMsg = 'Tarih çakışması (RPC): ' + rpcError.message;
        return 'failed';
      }
      console.error('[processPayment] sipariş oluşturma hatası:', rpcError.message);
      ctx.errorMsg = 'RPC hatası: ' + rpcError.message;
      return 'error';
    }

    console.log('[processPayment] sipariş oluşturuldu, conversation=%s', conversationId);

    sendAdminOrderNotification({
      conversationId,
      customerName,
      phone: customer.phone,
      email: customer.email ?? '',
      address: fullAddress,
      totalPrice: expectedPrice,
      shippingCost: Number(session.shipping_cost),
      items: orderItems,
    }).catch(e => console.error('[processPayment] admin bildirim e-postası gönderilemedi:', e));

    return 'success';
  } catch (err) {
    console.error('[processPayment] beklenmeyen hata:', err);
    ctx.errorMsg = err instanceof Error ? err.message : 'Beklenmeyen hata';
    return 'error';
  }
}
