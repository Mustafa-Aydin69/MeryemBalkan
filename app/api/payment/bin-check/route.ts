/**
 * Iyzico 3DS – Step 1: BIN CHECK
 * POST /api/payment/bin-check
 * Body: { binNumber: string, price: number | string } (price string gelirse normalize edilir; üst limit 1M TL)
 * Returns installment options from Iyzico; uses Iyzico values directly (no client-side calculation).
 *
 * TODO:
 * price should eventually be calculated server-side from cart or order.
 * frontend price should not be trusted in production.
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

export interface BinCheckInstallmentOption {
  installmentNumber: number;
  installmentPrice: number;
  totalPrice: number;
}

const BAD_REQUEST = { success: false, message: 'Invalid request' };
const SERVICE_ERROR = { success: false, message: 'Installment service temporarily unavailable' };

/** TL üst limit (anormal değerleri engellemek için) */
const MAX_PRICE_TL = 1_000_000;

/** Frontend'den string gelen price'ı sayıya çevirir; geçersizse NaN döner */
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

    const rawBin = body.binNumber != null ? String(body.binNumber).replace(/\s/g, '') : '';
    const binNumber = rawBin.trim();

    if (!/^\d{6}$/.test(binNumber)) {
      return NextResponse.json(BAD_REQUEST, { status: 400 });
    }

    const price = normalizePrice(body.price);
    if (Number.isNaN(price) || price <= 0) {
      return NextResponse.json(BAD_REQUEST, { status: 400 });
    }
    if (price > MAX_PRICE_TL) {
      return NextResponse.json(BAD_REQUEST, { status: 400 });
    }

    const request = {
      locale: 'tr' as const,
      conversationId: Date.now().toString(),
      binNumber,
      price: price.toFixed(2),
    };

    const result = await new Promise<{
      status?: string;
      installmentDetails?: {
        installmentPrices?: {
          installmentNumber: number;
          installmentPrice?: number;
          totalPrice: number;
        }[];
      }[];
    }>((resolve, reject) => {
      iyzipay.installmentInfo.retrieve(request, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as typeof result);
      });
    });

    if (result.status !== 'success') {
      return NextResponse.json(SERVICE_ERROR, { status: 502 });
    }

    const prices = result.installmentDetails?.[0]?.installmentPrices;
    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return NextResponse.json({
        success: true,
        installments: [
          { installmentNumber: 1, installmentPrice: price, totalPrice: price },
        ],
      });
    }

    const installments: BinCheckInstallmentOption[] = prices.map((p) => {
      const num = Number(p.installmentNumber) || 1;
      const total = Number(p.totalPrice);
      const perInstallment =
        typeof p.installmentPrice === 'number' && Number.isFinite(p.installmentPrice)
          ? p.installmentPrice
          : total / num;
      return {
        installmentNumber: num,
        installmentPrice: Math.round(perInstallment * 100) / 100,
        totalPrice: total,
      };
    });

    return NextResponse.json({ success: true, installments });
  } catch {
    return NextResponse.json(SERVICE_ERROR, { status: 502 });
  }
}
