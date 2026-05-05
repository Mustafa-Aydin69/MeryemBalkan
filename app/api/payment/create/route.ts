export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import 'postman-request';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { checkRateLimit, incrementRateLimit, getClientIP } from '@/app/lib/rate-limiter';

const Iyzipay = require('iyzipay');

const IYZICO_URI = process.env.IYZICO_BASE_URL || '';

if (!IYZICO_URI) {
  console.error('[iyzipay] IYZICO_BASE_URL is not set — library will fall back to production endpoint!');
}

const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY    || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri:       IYZICO_URI,
});

const SHIPPING_COST_TL = 500;
const MAX_PRICE_TL = 1_000_000;
const SESSION_TTL_MS = 30 * 60 * 1000;
const BLOCKING_STATUSES = ['Hazırlanıyor', 'Kirada'];

const CartItemSchema = z.object({
  productId: z.union([z.string(), z.number()])
    .transform(String)
    .pipe(z.string().min(1).max(100)),
  color: z.string().min(1).max(100).transform(v => v.trim()),
  size: z.string().min(1).max(50).transform(v => v.trim()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD formatında olmalı'),
});

const CustomerSchema = z.object({
  firstName: z.string().min(1).max(100).transform(v => v.trim()),
  lastName: z.string().min(1).max(100).transform(v => v.trim()),
  phone: z.string().min(10).max(20).transform(v => v.trim()),
  email: z.string().email().max(254).transform(v => v.trim().toLowerCase()),
  tcNo: z.string().regex(/^[1-9][0-9]{10}$/, 'TC Kimlik No geçersiz'),
});

const AddressSchema = z.object({
  address: z.string().min(1).max(500).transform(v => v.trim()),
  district: z.string().max(100).default('').transform(v => v.trim()),
  city: z.string().min(1).max(100).transform(v => v.trim()),
  postalCode: z.string().max(20).default('').transform(v => v.trim()),
});

const CreatePaymentSchema = z.object({
  cartItems: z.array(CartItemSchema).min(1).max(20),
  customer: CustomerSchema,
  shippingAddress: AddressSchema,
  deliveryMethod: z.enum(['pickup', 'shipping']),
});

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

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+9${digits}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+90${digits}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rateLimit = checkRateLimit(ip, 'PAYMENT_CREATE', ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? 60) } }
    );
  }
  incrementRateLimit(ip, 'PAYMENT_CREATE', ip);

  try {
    const body = await req.json();
    const parsed = CreatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      const message = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ') || 'Geçersiz istek';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    const { cartItems, customer, shippingAddress, deliveryMethod } = parsed.data;

    const supabase = getSupabaseAdmin();

    const rawIds = cartItems.map(i => parseInt(i.productId.split('_')[0], 10));
    const productIdNumbers = [...new Set(rawIds.filter(n => !isNaN(n) && n > 0))];

    if (productIdNumbers.length === 0) {
      return NextResponse.json({ success: false, error: 'Geçersiz ürün ID' }, { status: 400 });
    }

    const { data: products, error: fetchError } = await supabase
      .from('urunler')
      .select('id, price, status, title')
      .in('id', productIdNumbers);

    if (fetchError || !products) {
      return NextResponse.json({ success: false, error: 'Ürün bilgileri alınamadı' }, { status: 500 });
    }

    const productMap = new Map<number, { price: number; title: string; status: string }>();
    for (const p of products) {
      productMap.set(p.id, { price: parseDBPrice(p.price), title: p.title ?? '', status: p.status ?? '' });
    }

    for (const item of cartItems) {
      const id = parseInt(item.productId.split('_')[0], 10);
      const product = productMap.get(id);
      if (!product) {
        return NextResponse.json({ success: false, error: `Ürün bulunamadı: ${item.productId}` }, { status: 400 });
      }
      if (product.status !== 'Yayında') {
        return NextResponse.json({ success: false, error: `"${product.title}" siparişe uygun değil.` }, { status: 400 });
      }
    }

    for (const item of cartItems) {
      const id = parseInt(item.productId.split('_')[0], 10);
      const product = productMap.get(id)!;
      const date = new Date(item.date);
      const start = new Date(date); start.setDate(start.getDate() - 7);
      const end = new Date(date); end.setDate(end.getDate() + 7);

      const { data: conflicts } = await supabase
        .from('orders_items')
        .select('id')
        .eq('product_name', product.title)
        .in('status', BLOCKING_STATUSES)
        .gte('event_date', start.toISOString().split('T')[0])
        .lte('event_date', end.toISOString().split('T')[0]);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { success: false, error: `"${product.title}" seçilen tarihte müsait değil. Lütfen farklı bir tarih seçin.` },
          { status: 409 }
        );
      }
    }

    const shippingCost = deliveryMethod === 'shipping' ? SHIPPING_COST_TL : 0;
    let itemsTotal = 0;
    for (const item of cartItems) {
      const id = parseInt(item.productId.split('_')[0], 10);
      itemsTotal += productMap.get(id)!.price;
    }
    const totalPrice = itemsTotal + shippingCost;

    if (totalPrice <= 0 || totalPrice > MAX_PRICE_TL) {
      return NextResponse.json({ success: false, error: 'Geçersiz tutar' }, { status: 400 });
    }

    const conversationId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    const { error: sessionError } = await supabase
      .from('payment_sessions')
      .insert({
        conversation_id: conversationId,
        cart_items: cartItems,
        customer,
        shipping_address: shippingAddress,
        delivery_method: deliveryMethod,
        shipping_cost: shippingCost,
        total_price: totalPrice,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error('Session oluşturma hatası:', sessionError.message);
      return NextResponse.json({ success: false, error: 'Ödeme oturumu başlatılamadı' }, { status: 500 });
    }

    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || '';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
    const callbackUrl = `${baseUrl}/api/payment/callback`;

    const fullAddress = [shippingAddress.address, shippingAddress.district, shippingAddress.city, shippingAddress.postalCode]
      .filter(Boolean)
      .join(', ');

    const basketItems: object[] = cartItems.map(item => {
      const id = parseInt(item.productId.split('_')[0], 10);
      const product = productMap.get(id)!;
      return {
        id: String(id),
        name: product.title,
        category1: 'Kıyafet Kiralama',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: product.price.toFixed(2),
      };
    });

    if (shippingCost > 0) {
      basketItems.push({
        id: 'shipping',
        name: 'Kargo Ücreti',
        category1: 'Kargo',
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: shippingCost.toFixed(2),
      });
    }

    const iyzicoRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: totalPrice.toFixed(2),
      paidPrice: totalPrice.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: conversationId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: conversationId,
        name: customer.firstName,
        surname: customer.lastName,
        gsmNumber: normalizePhone(customer.phone),
        email: customer.email,
        identityNumber: customer.tcNo,
        registrationAddress: fullAddress,
        ip: ip !== 'unknown' ? ip : '127.0.0.1',
        city: shippingAddress.city,
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: `${customer.firstName} ${customer.lastName}`,
        city: shippingAddress.city,
        country: 'Turkey',
        address: fullAddress,
      },
      billingAddress: {
        contactName: `${customer.firstName} ${customer.lastName}`,
        city: shippingAddress.city,
        country: 'Turkey',
        address: fullAddress,
      },
      basketItems,
    };

    const iyzicoResult = await new Promise<{
      status?: string;
      paymentPageUrl?: string;
      errorMessage?: string;
      [k: string]: unknown;
    }>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(iyzicoRequest, (err: Error | null, res: unknown) => {
        if (err) return reject(err);
        resolve(res as typeof iyzicoResult);
      });
    });

    console.log('[iyzipay result] status=%s errorCode=%s errorMessage=%s paymentPageUrl=%s',
      iyzicoResult.status,
      iyzicoResult.errorCode,
      iyzicoResult.errorMessage,
      iyzicoResult.paymentPageUrl
    );

    if (iyzicoResult.status !== 'success' || !iyzicoResult.paymentPageUrl) {
      await supabase.from('payment_sessions').delete().eq('conversation_id', conversationId);
      return NextResponse.json(
        { success: false, error: iyzicoResult.errorMessage || 'Ödeme sayfası başlatılamadı' },
        { status: 400 }
      );
    }

    // Store the Iyzico token in the session so the callback can claim by token
    // (checkoutForm.retrieve does not return conversationId in this library version)
    const iyzicoToken = new URL(iyzicoResult.paymentPageUrl).searchParams.get('token');
    if (iyzicoToken) {
      await supabase
        .from('payment_sessions')
        .update({ iyzico_token: iyzicoToken })
        .eq('conversation_id', conversationId);
    }

    return NextResponse.json({ success: true, paymentPageUrl: iyzicoResult.paymentPageUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sunucu hatası';
    console.error('POST /api/payment/create error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
