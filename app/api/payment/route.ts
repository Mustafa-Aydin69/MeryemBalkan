/**
 * Ödeme API – Iyzico payment.create
 * POST body: price, currency, basketId, paymentCard, buyer, shippingAddress, billingAddress, basketItems, installment
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri: process.env.IYZICO_BASE_URL || '',
});

/** TL üst limit (anormal değerleri engellemek için) */
const MAX_PRICE_TL = 1_000_000;

/** String veya number gelen price'ı normalize eder; geçersizse NaN */
function normalizePrice(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/\s/g, '');
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : NaN;
  }
  return NaN;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      price: rawPrice,
      currency = 'TRY',
      basketId,
      paymentCard,
      buyer,
      shippingAddress,
      billingAddress,
      basketItems,
      installment = 1,
    } = body;

    const price = normalizePrice(rawPrice);
    if (Number.isNaN(price) || price <= 0 || price > MAX_PRICE_TL) {
      return NextResponse.json(
        { error: 'Geçersiz veya izin verilen üst sınırı aşan tutar' },
        { status: 400 }
      );
    }

    if (!basketId || !paymentCard || !buyer || !shippingAddress || !billingAddress || !basketItems?.length) {
      return NextResponse.json(
        { error: 'Eksik alan: basketId, paymentCard, buyer, shippingAddress, billingAddress, basketItems gerekli' },
        { status: 400 }
      );
    }

    const cardNumber = (paymentCard.cardNumber || '').replace(/\s+/g, '');
    const mappedPaymentCard = {
      cardHolderName: (paymentCard.cardHolderName || paymentCard.cardName || '').trim(),
      cardNumber,
      expireMonth: String(Number((paymentCard.expireMonth ?? paymentCard.expiryMonth ?? '').toString().trim()) || '').padStart(2, '0'),
      expireYear: (paymentCard.expireYear ?? paymentCard.expiryYear ?? '').toString().trim(),
      cvc: (paymentCard.cvc ?? paymentCard.cvv ?? '').trim(),
      registerCard: paymentCard.registerCard ?? '0',
    };

    const binNumber = cardNumber.substring(0, 6);
    const priceStr = price.toFixed(2);

    const checkRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: Date.now().toString(),
      binNumber,
      price: priceStr,
    };

    const installmentResult = await new Promise<{
      status?: string;
      installmentDetails?: { installmentPrices?: { installmentNumber: number; totalPrice: number }[] }[];
    }>((resolve, reject) => {
      iyzipay.installmentInfo.retrieve(checkRequest, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as typeof installmentResult);
      });
    });

    if (!installmentResult.installmentDetails?.length) {
      return NextResponse.json({ error: 'Bu kart için taksit bilgisi alınamadı' }, { status: 400 });
    }

    const prices = installmentResult.installmentDetails[0]?.installmentPrices || [];
    const installmentOption = prices.find((p: { installmentNumber: number }) => p.installmentNumber === Number(installment || 1));
    const paidPrice = installmentOption ? installmentOption.totalPrice : priceStr;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: Date.now().toString(),
      price: priceStr,
      paidPrice: String(paidPrice),
      currency: currency === 'TRY' ? Iyzipay.CURRENCY.TRY : currency,
      installment: Number(installment || 1),
      basketId: String(basketId),
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: mappedPaymentCard,
      buyer,
      shippingAddress,
      billingAddress,
      basketItems,
    };

    const paymentResult = await new Promise<{ status?: string; errorMessage?: string; [k: string]: unknown }>((resolve, reject) => {
      iyzipay.payment.create(request, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as typeof paymentResult);
      });
    });

    if (paymentResult.status !== 'success') {
      return NextResponse.json(
        { error: paymentResult.errorMessage || 'Ödeme işlemi başarısız' },
        { status: 400 }
      );
    }

    return NextResponse.json(paymentResult);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ödeme sırasında hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
