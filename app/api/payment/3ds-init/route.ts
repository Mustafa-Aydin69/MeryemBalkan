/**
 * Iyzico 3DS – Step 2: 3DS Başlatma
 * POST /api/payment/3ds-init
 * Fiyat SADECE veritabanından hesaplanır; frontend'den gelen price kullanılmaz.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getClientIP } from '@/app/lib/rate-limiter';



const FAIL_RESPONSE = { success: false, message: '3DS initialization failed' };
const ALREADY_PAID_RESPONSE = { success: false, message: 'Bu sipariş için ödeme zaten alınmış.' };
const IDEMPOTENCY_IN_PROGRESS = { success: false, message: 'Ödeme işlemi zaten devam ediyor. Lütfen bekleyin.' };
const MAX_SHIPPING_TL = 2000;
const IDEMPOTENCY_TABLE = 'payment_idempotency';

/** Sipariş tablosundaki price alanını sayıya çevirir (örn. "8500 TL" -> 8500) */
function parsePriceFromOrder(price: unknown): number {
  if (typeof price === 'number' && Number.isFinite(price)) return price;
  const str = String(price ?? '').trim().replace(/\s/g, '');
  const num = parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
}

/** orderId: "123" veya "123-456" -> [123, 456] */
function parseOrderIds(orderId: string): number[] {
  return orderId
    .split('-')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

export async function POST(req: NextRequest) {
  try {
    const Iyzipay = require('iyzipay');
    const iyzipay = new Iyzipay({

      apiKey: process.env.IYZICO_API_KEY || '',
      secretKey: process.env.IYZICO_SECRET_KEY || '',
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    });

    const body = await req.json();

    const orderId = body.orderId != null ? String(body.orderId).trim() : '';
    if (!orderId) {
      return NextResponse.json(FAIL_RESPONSE, { status: 400 });
    }

    const ids = parseOrderIds(orderId);
    if (ids.length === 0) {
      return NextResponse.json(FAIL_RESPONSE, { status: 400 });
    }

    const installment = Math.floor(Number(body.installment)) || 1;
    const paymentCard = body.paymentCard;
    const buyer = body.buyer;
    const shippingAddress = body.shippingAddress != null ? String(body.shippingAddress).trim() : '';

    if (
      !paymentCard ||
      !buyer ||
      !shippingAddress ||
      !paymentCard.cardHolderName ||
      !paymentCard.cardNumber ||
      !paymentCard.expireMonth ||
      !paymentCard.expireYear ||
      !paymentCard.cvc ||
      !buyer.name ||
      !buyer.surname ||
      !buyer.email ||
      !buyer.phone
    ) {
      return NextResponse.json(FAIL_RESPONSE, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: orders, error } = await supabase
      .from('siparisler')
      .select('id, price, status')
      .in('id', ids)
      .eq('status', 'Ödeme Yapıyor')
      .is('OdemeID', null);

    if (error) {
      return NextResponse.json(FAIL_RESPONSE, { status: 400 });
    }

    if (!orders || orders.length === 0 || orders.length !== ids.length) {
      console.warn('Duplicate payment attempt blocked', { orderIds: ids, conversationId: orderId });
      return NextResponse.json(ALREADY_PAID_RESPONSE, { status: 400 });
    }

    let calculatedPrice = orders.reduce((sum, row) => sum + parsePriceFromOrder(row.price), 0);
    const rawShipping = body.shippingCost != null ? Number(body.shippingCost) : 0;
    const shippingCost = Number.isFinite(rawShipping) && rawShipping >= 0 && rawShipping <= MAX_SHIPPING_TL ? rawShipping : 0;
    calculatedPrice += shippingCost;
    if (calculatedPrice <= 0) {
      return NextResponse.json(FAIL_RESPONSE, { status: 400 });
    }

    const binNumber = String(paymentCard.cardNumber || '').replace(/\s/g, '').slice(0, 6);
    let paidPrice = calculatedPrice;
    if (binNumber.length === 6 && installment > 1) {
      const binCheckRequest = {
        locale: 'tr' as const,
        conversationId: orderId,
        binNumber,
        price: calculatedPrice.toFixed(2),
      };
      const installmentResult = await new Promise<{
        status?: string;
        installmentDetails?: { installmentPrices?: { installmentNumber: number; totalPrice: number }[] }[];
      }>((resolve, reject) => {
        iyzipay.installmentInfo.retrieve(binCheckRequest, (err: Error | null, res: unknown) => {
          if (err) return reject(err);
          resolve(res as typeof installmentResult);
        });
      });
      if (installmentResult.status === 'success' && installmentResult.installmentDetails?.[0]?.installmentPrices) {
        const option = installmentResult.installmentDetails[0].installmentPrices.find(
          (p: { installmentNumber: number }) => Number(p.installmentNumber) === installment
        );
        if (option && Number(option.totalPrice) > 0) {
          paidPrice = Number(option.totalPrice);
        }
      }
    }

    const ip = getClientIP(req);
    const buyerIp = ip && ip !== 'unknown' ? ip : '127.0.0.1';

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const callbackUrl = `${baseUrl}/api/payment/3ds-callback`;

    if (!callbackUrl) {
      return NextResponse.json(FAIL_RESPONSE, { status: 500 });
    }

    const contactName = `${String(buyer.name).trim()} ${String(buyer.surname).trim()}`.trim();
    const request = {
      locale: 'tr' as const,
      conversationId: orderId,
      price: calculatedPrice.toFixed(2),
      paidPrice: paidPrice.toFixed(2),
      currency: 'TRY' as const,
      installment: String(installment),
      basketId: orderId,
      paymentChannel: 'WEB' as const,
      paymentGroup: 'PRODUCT' as const,
      callbackUrl,
      paymentCard: {
        cardHolderName: String(paymentCard.cardHolderName).trim(),
        cardNumber: String(paymentCard.cardNumber).replace(/\s/g, ''),
        expireMonth: String(paymentCard.expireMonth).trim(),
        expireYear: String(paymentCard.expireYear).trim(),
        cvc: String(paymentCard.cvc).trim(),
        registerCard: '0',
      },
      buyer: {
        id: orderId,
        name: String(buyer.name).trim(),
        surname: String(buyer.surname).trim(),
        gsmNumber: String(buyer.phone).trim(),
        email: String(buyer.email).trim(),
        identityNumber: '11111111111',
        registrationAddress: shippingAddress,
        ip: buyerIp,
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '',
      },
      shippingAddress: {
        contactName,
        city: 'Istanbul',
        country: 'Turkey',
        address: shippingAddress,
        zipCode: '',
      },
      billingAddress: {
        contactName,
        city: 'Istanbul',
        country: 'Turkey',
        address: shippingAddress,
        zipCode: '',
      },
      basketItems: [
        {
          id: orderId,
          name: 'Order Payment',
          category1: 'Rental',
          category2: 'Rental',
          itemType: 'PHYSICAL' as const,
          price: calculatedPrice.toFixed(2),
        },
      ],
    };

    try {
      await supabase
        .from('siparisler')
        .update({ expected_paid_total: paidPrice })
        .in('id', ids)
        .eq('status', 'Ödeme Yapıyor')
        .is('OdemeID', null);
    } catch {
      // expected_paid_total sütunu yoksa veya hata olursa devam et
    }

    const idempotencyKey = body.idempotencyKey != null ? String(body.idempotencyKey).trim() : '';
    let idempotencyRowInserted = false;

    if (idempotencyKey.length > 0) {
      try {
        const { error: insertErr } = await supabase
          .from(IDEMPOTENCY_TABLE)
          .insert({
            idempotency_key: idempotencyKey,
            conversation_id: orderId,
            response_body: null,
          });

        if (insertErr) {
          if (insertErr.code === '23505') {
            const { data: existing } = await supabase
              .from(IDEMPOTENCY_TABLE)
              .select('response_body')
              .eq('idempotency_key', idempotencyKey)
              .single();
            if (existing?.response_body != null) {
              return NextResponse.json(existing.response_body as object, { status: 200 });
            }
            return NextResponse.json(IDEMPOTENCY_IN_PROGRESS, { status: 409 });
          }
        } else {
          idempotencyRowInserted = true;
        }
      } catch {
        // Tablo yoksa veya hata varsa idempotency atlanır, normal akış devam eder
      }
    }

    const result = await new Promise<{ status?: string; threeDSHtmlContent?: string }>((resolve, reject) => {
      console.log("Iyzipay İçindeki Nesneler (Anahtarlar):", Object.keys(iyzipay));
      iyzipay.threeDSInitialize.create(request, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as typeof result);
      });
    });

    const successResponse = result.status === 'success' && result.threeDSHtmlContent
      ? { success: true, htmlContent: result.threeDSHtmlContent }
      : null;
    const errorResponse = successResponse ? null : FAIL_RESPONSE;

    if (idempotencyRowInserted && idempotencyKey.length > 0) {
      try {
        await supabase
          .from(IDEMPOTENCY_TABLE)
          .update({ response_body: successResponse ?? errorResponse })
          .eq('idempotency_key', idempotencyKey);
      } catch {
        // Güncelleme hatası ödeme yanıtını engellemez
      }
    }

    if (result.status !== 'success' || !result.threeDSHtmlContent) {
      return NextResponse.json(FAIL_RESPONSE, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      htmlContent: result.threeDSHtmlContent,
    });
  } catch (error: any) {
    // Bu satır, Vercel'in kendi "Logs" ekranında hatanın gerçek sebebini görmemizi sağlar
    console.error("3DS Init Hata Detayı:", error);

    return NextResponse.json(
      { success: false, message: error.message || '3DS initialization failed' },
      { status: 502 }
    );
  }
}
