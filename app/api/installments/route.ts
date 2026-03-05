/**
 * Taksit Seçenekleri API – Iyzico Installment Info
 * POST body: { binNumber?, bin?, price?, totalPrice? }
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

function normalizeInstallments(installmentDetails: { installmentPrices?: { installmentNumber: number; totalPrice: number }[] }[]): {
  count: number;
  totalAmount: number;
  installmentAmount: number;
  interestRate: number;
}[] {
  const list = installmentDetails?.[0]?.installmentPrices;
  if (!list || !Array.isArray(list)) return [];
  return list.map((item: { installmentNumber: number; totalPrice: number }) => ({
    count: item.installmentNumber,
    totalAmount: item.totalPrice,
    installmentAmount: Math.round((item.totalPrice * 100) / item.installmentNumber) / 100,
    interestRate: 0,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const binNumber = (body.binNumber ?? body.bin ?? '').toString().replace(/\s/g, '');
    const price = Number(body.price ?? body.totalPrice ?? 0);

    if (!binNumber || binNumber.length < 6) {
      return NextResponse.json({
        success: false,
        cardType: '',
        bankName: '',
        installments: [],
        error: 'Geçersiz BIN numarası',
      }, { status: 400 });
    }

    if (!price || price <= 0) {
      return NextResponse.json({
        success: false,
        cardType: '',
        bankName: '',
        installments: [],
        error: 'Geçersiz tutar',
      }, { status: 400 });
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: Date.now().toString(),
      binNumber,
      price: price.toFixed(2),
    };

    const result = await new Promise<{
      status?: string;
      installmentDetails?: { installmentPrices?: { installmentNumber: number; totalPrice: number }[] }[];
      cardAssociation?: string;
      cardFamilyName?: string;
    }>((resolve, reject) => {
      iyzipay.installmentInfo.retrieve(request, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as typeof result);
      });
    });

    if (!result.installmentDetails || result.installmentDetails.length === 0) {
      return NextResponse.json({
        success: true,
        cardType: result.cardAssociation || '',
        bankName: result.cardFamilyName || '',
        installments: [{ count: 1, totalAmount: price, installmentAmount: price, interestRate: 0 }],
      });
    }

    const installments = normalizeInstallments(result.installmentDetails);
    return NextResponse.json({
      success: true,
      cardType: result.cardAssociation || '',
      bankName: result.cardFamilyName || '',
      installments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Taksit bilgileri alınamadı';
    return NextResponse.json({
      success: false,
      cardType: '',
      bankName: '',
      installments: [],
      error: message,
    });
  }
}
