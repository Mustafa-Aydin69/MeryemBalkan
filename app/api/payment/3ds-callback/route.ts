/**
 * Iyzico 3DS – Callback (bankadan dönüş)
 * POST /api/payment/3ds-callback
 * Form-data ile gelen conversationId, paymentId, conversationData ile ödemeyi tamamlar.
 * Ödeme tutarı, veritabanındaki sipariş toplamı ile karşılaştırılır; eşleşmezse güncelleme yapılmaz.
 *
 * Not: Kargo veya taksit farkı paidPrice'ı etkiliyorsa,
 * ya DB'de nihai sipariş toplamını saklayın (önerilir), ya da expectedPrice hesaplamasına kargoyu dahil edin.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import 'postman-request';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri: process.env.IYZICO_BASE_URL || '',
});

function htmlPage(title: string, message: string, isSuccess: boolean): string {
  const bg = isSuccess ? '#0f766e' : '#b91c1c';
  const color = '#fff';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:${bg};color:${color};font-family:system-ui,sans-serif;text-align:center;padding:1rem;"><div><h1 style="font-size:1.5rem;margin-bottom:0.5rem;">${title}</h1><p style="margin:0;opacity:0.9;">${message}</p></div></body></html>`;
}

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

/** paidPrice string veya number gelirse sayıya normalize eder */
function normalizePaidPrice(paidPriceRaw: unknown): number {
  if (typeof paidPriceRaw === 'number' && Number.isFinite(paidPriceRaw)) return paidPriceRaw;
  if (typeof paidPriceRaw === 'string') return parseFloat(String(paidPriceRaw).replace(',', '.')) || 0;
  return 0;
}

const PRICE_TOLERANCE = 0.02;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const conversationId = (formData.get('conversationId') ?? formData.get('conversation_id'))?.toString()?.trim() ?? '';
    const paymentId = (formData.get('paymentId') ?? formData.get('payment_id'))?.toString()?.trim() ?? '';
    const conversationData = (formData.get('conversationData') ?? formData.get('conversation_data'))?.toString()?.trim() ?? '';
    const mdStatus = (formData.get('mdStatus') ?? formData.get('md_status'))?.toString()?.trim() ?? '';

    if (!conversationId || !paymentId) {
      return new NextResponse(
        htmlPage('Ödeme başarısız', 'Eksik bilgi. Lütfen tekrar deneyin.', false),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    if (mdStatus && mdStatus !== '1') {
      return new NextResponse(
        htmlPage('Ödeme başarısız', `3DS doğrulaması başarısız (mdStatus=${mdStatus}).`, false),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    const request: any = {
      locale: 'tr' as const,
      conversationId,
      paymentId,
    };

    if (conversationData) {
      request.conversationData = conversationData;
    }

    const paymentResult = await new Promise<{ status?: string; errorMessage?: string; paidPrice?: number | string; installment?: number | string }>((resolve, reject) => {
      iyzipay.threedsPayment.create(request, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as { status?: string; errorMessage?: string; paidPrice?: number | string; installment?: number | string });
      });
    });
    console.log('3DS threedsPayment result:', paymentResult);

    if (paymentResult.status !== 'success') {
      return new NextResponse(
        htmlPage('Ödeme başarısız', 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.', false),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const paidPrice = normalizePaidPrice(paymentResult.paidPrice);

    const orderIds = parseOrderIds(conversationId);
    if (orderIds.length === 0) {
      return new NextResponse(
        htmlPage('Ödeme başarısız', 'Geçersiz sipariş bilgisi.', false),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: orders, error: fetchError } = await supabase
      .from('siparisler')
      .select('id, price, status, expected_paid_total')
      .in('id', orderIds)
      .eq('status', 'Ödeme Yapıyor');

    if (fetchError || !orders || orders.length === 0) {
      return new NextResponse(
        htmlPage('Ödeme başarısız', 'Sipariş bulunamadı veya zaten işlendi.', false),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const storedExpected = orders[0]?.expected_paid_total != null ? Number(orders[0].expected_paid_total) : NaN;
    const expectedPrice = Number.isFinite(storedExpected) && storedExpected > 0
      ? storedExpected
      : orders.reduce((sum, o) => sum + parsePriceFromOrder(o.price), 0);
    const paidPriceRounded = Math.round(paidPrice * 100) / 100;
    const expectedRounded = Math.round(expectedPrice * 100) / 100;

    if (Math.abs(paidPriceRounded - expectedRounded) > PRICE_TOLERANCE) {
      console.error('Payment price mismatch', {
        paidPrice: paidPriceRounded,
        expectedPrice: expectedRounded,
        conversationId,
        paymentId,
      });
      return new NextResponse(
        htmlPage('Ödeme başarısız', 'Ödeme tutarı sipariş tutarı ile eşleşmiyor. Lütfen destek ile iletişime geçin.', false),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const installment =
      paymentResult.installment != null
        ? typeof paymentResult.installment === 'number'
          ? paymentResult.installment
          : parseInt(String(paymentResult.installment), 10) || 1
        : 1;

    console.log('3DS callback: payment persisted', {
      paymentId,
      paidPrice: paidPriceRounded,
      installment,
      orderIds,
      conversationId,
      expectedPrice: expectedRounded,
    });

    await supabase
      .from('siparisler')
      .update({
        status: 'Hazırlanıyor',
        OdemeID: paymentId,
        paid_price: paidPriceRounded,
        installment,
      })
      .in('id', orderIds)
      .eq('status', 'Ödeme Yapıyor');

    return new NextResponse(
      htmlPage('Ödeme başarılı', 'Ödemeniz alındı.', true),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch {
    return new NextResponse(
      htmlPage('Ödeme başarısız', 'Bir hata oluştu. Lütfen tekrar deneyin.', false),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
