/**
 * Iyzico webhook – ödeme bildirimleri (doğrulamalı)
 * POST /api/payment/webhook
 * Payload doğrulanmadan güvenilmez; iyzico payment.retrieve ile teyit edilir.
 * Her zaman 200 + { success: true } döner (retry döngüsü önlemek için).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri: process.env.IYZICO_BASE_URL || '',
});

/** conversationId: "123" veya "123-456" -> [123, 456] */
function parseOrderIds(conversationId: string): number[] {
  return conversationId
    .split('-')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

/** Sipariş tablosundaki price alanını sayıya çevirir (örn. "8500 TL" -> 8500) */
function parsePriceFromOrder(price: unknown): number {
  if (typeof price === 'number' && Number.isFinite(price)) return price;
  const str = String(price ?? '').trim().replace(/\s/g, '');
  const num = parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
}

/** Callback ile aynı: iyzico paidPrice ile DB toplamı karşılaştırmasında kullanılır */
const PRICE_TOLERANCE = 0.02;

function ok() {
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook received:', body);

    const eventType = body.eventType != null ? String(body.eventType).trim() : '';
    const paymentId = body.paymentId != null ? String(body.paymentId).trim() : '';
    const conversationId = body.conversationId != null ? String(body.conversationId).trim() : '';
    const status = body.status != null ? String(body.status).trim() : '';
    const _paidPrice = body.paidPrice != null ? body.paidPrice : null;
    const _signature = body.signature != null ? body.signature : '';

    if (!eventType || !paymentId || !conversationId || !status) {
      return ok();
    }

    const retrieveRequest = {
      locale: 'tr' as const,
      conversationId,
      paymentId,
    };

    const payment = await new Promise<{
      status?: string;
      paymentId?: string;
      paidPrice?: number | string;
      basketId?: string;
      installment?: number | string;
    }>((resolve, reject) => {
      iyzipay.payment.retrieve(retrieveRequest, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as typeof payment);
      });
    });

    console.log('Webhook: verified payment from iyzico', payment);

    if (payment.status !== 'success') {
      return ok();
    }

    const verifiedPaymentId = payment.paymentId != null ? String(payment.paymentId).trim() : '';
    const paidPriceRaw = payment.paidPrice;
    const paidPrice =
      typeof paidPriceRaw === 'number' && Number.isFinite(paidPriceRaw)
        ? paidPriceRaw
        : typeof paidPriceRaw === 'string'
          ? parseFloat(String(paidPriceRaw).replace(',', '.'))
          : NaN;
    const _basketId = payment.basketId;
    const installment =
      payment.installment != null
        ? typeof payment.installment === 'number'
          ? payment.installment
          : parseInt(String(payment.installment), 10) || 1
        : 1;

    if (!verifiedPaymentId || Number.isNaN(paidPrice) || paidPrice <= 0) {
      return ok();
    }

    const orderIds = parseOrderIds(conversationId);
    if (orderIds.length === 0) {
      return ok();
    }

    const supabase = getSupabaseAdmin();
    const { data: orders, error: fetchError } = await supabase
      .from('siparisler')
      .select('id, price, status, expected_paid_total')
      .in('id', orderIds)
      .eq('status', 'Ödeme Yapıyor');

    if (fetchError || !orders || orders.length === 0) {
      return ok();
    }

    const storedExpected = orders[0]?.expected_paid_total != null ? Number(orders[0].expected_paid_total) : NaN;
    const expectedPrice = Number.isFinite(storedExpected) && storedExpected > 0
      ? storedExpected
      : orders.reduce((sum, row) => sum + parsePriceFromOrder(row.price), 0);
    const paidPriceRounded = Math.round(paidPrice * 100) / 100;
    const expectedRounded = Math.round(expectedPrice * 100) / 100;

    if (Math.abs(paidPriceRounded - expectedRounded) > PRICE_TOLERANCE) {
      console.error('Webhook price mismatch', {
        paidPrice: paidPriceRounded,
        expectedPrice: expectedRounded,
        conversationId,
        paymentId: verifiedPaymentId,
      });
      return ok();
    }

    console.log('Webhook: payment persisted', {
      paymentId: verifiedPaymentId,
      paidPrice: paidPriceRounded,
      installment,
      orderIds,
    });

    await supabase
      .from('siparisler')
      .update({
        status: 'Hazırlanıyor',
        OdemeID: verifiedPaymentId,
        paid_price: paidPriceRounded,
        installment,
      })
      .in('id', orderIds)
      .eq('status', 'Ödeme Yapıyor');

    return ok();
  } catch (err) {
    console.error('Webhook error:', err);
    return ok();
  }
}
