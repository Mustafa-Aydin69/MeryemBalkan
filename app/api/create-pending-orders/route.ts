// Bekleyen sipariş oluşturma API - Server-side
// Fiyat ve ürün bilgisi SADECE veritabanından; istemci fiyatı kabul edilmez.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIP,
} from '@/app/lib/rate-limiter';

// İstemci sözleşmesi — fiyat YOK; sunucu veritabanından alır
const CartItemSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1, 'productId gerekli').max(100)),
  color: z.string().max(100),
  size: z.string().max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD formatında olmalı'),
  // title, image, id istemci gönderebilir ama siparişte kullanılmaz; ürün adı DB'den gelir. price YOK — yok sayılır.
  title: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
  id: z.string().max(100).optional(),
});

const CustomerSchema = z.object({
  firstName: z.string().min(1, 'Ad gerekli').max(100),
  lastName: z.string().min(1, 'Soyad gerekli').max(100),
  phone: z.string().min(10, 'Geçerli telefon gerekli').max(20),
  email: z.string().email().optional().or(z.literal('')).transform((v) => v || undefined),
});

const CreatePendingOrdersSchema = z.object({
  items: z.array(CartItemSchema).min(1, 'En az 1 ürün gerekli').max(20, 'En fazla 20 ürün'),
  customer: CustomerSchema,
  address: z.string().min(1, 'Adres gerekli').max(1000),
});

export type CreatePendingOrdersBody = z.infer<typeof CreatePendingOrdersSchema>;

export async function POST(request: NextRequest) {
  try {
    // IP tabanlı hız sınırı: 5 dakikada en fazla 10 istek
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(ip, 'CHECKOUT_CREATE', ip);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfter ?? 300;
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }
    incrementRateLimit(ip, 'CHECKOUT_CREATE', ip);

    const body = await request.json();
    const parseResult = CreatePendingOrdersSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.flatten().fieldErrors;
      const message = Object.values(firstError).flat().join(' ') || 'Geçersiz istek';
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }
    const { items, customer, address } = parseResult.data;

    const supabase = getSupabaseAdmin();

    // Benzersiz productId listesi (sayıya çevrilebilir id kullanılıyorsa)
    const productIds = [...new Set(items.map((i) => i.productId.trim()))];
    const productIdNumbers = productIds
      .map((id) => parseInt(id, 10))
      .filter((n) => !Number.isNaN(n) && n > 0);

    if (productIdNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz ürün ID' },
        { status: 400 }
      );
    }

    // Ürünleri veritabanından çek: id, price, status, title
    const { data: products, error: fetchError } = await supabase
      .from('urunler')
      .select('id, price, status, title')
      .in('id', productIdNumbers);

    if (fetchError) {
      console.error('Ürün çekme hatası:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Ürün bilgileri alınamadı', orderIds: [] },
        { status: 500 }
      );
    }

    const productMap = new Map<number, { price: number | string; title: string }>();
    for (const p of products ?? []) {
      productMap.set(p.id, { price: p.price, title: p.title ?? '' });
    }

    // Her istek öğesi için: ürün var mı, Yayında mı?
    for (const item of items) {
      const id = parseInt(item.productId, 10);
      if (Number.isNaN(id) || id < 1) {
        return NextResponse.json(
          { success: false, error: `Geçersiz ürün ID: ${item.productId}`, orderIds: [] },
          { status: 400 }
        );
      }
      const product = productMap.get(id);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Ürün bulunamadı: ${item.productId}`, orderIds: [] },
          { status: 400 }
        );
      }
      // status kontrolü: sadece "Yayında" olan ürünler
      const row = products!.find((r) => r.id === id);
      if (row?.status !== 'Yayında') {
        return NextResponse.json(
          { success: false, error: `Ürün siparişe uygun değil: ${item.productId}`, orderIds: [] },
          { status: 400 }
        );
      }
    }

    const orderIds: number[] = [];
    const orderDate = new Date().toISOString().split('T')[0];
    const customerName = `${customer.firstName} ${customer.lastName}`.trim();

    for (const item of items) {
      const id = parseInt(item.productId, 10);
      const product = productMap.get(id)!;
      const priceRaw = product.price;
      const priceStr = typeof priceRaw === 'number' ? `${priceRaw} TL` : `${priceRaw}`.trim() || '0 TL';

      const { data, error } = await supabase
        .from('siparisler')
        .insert({
          customerName,
          phone: customer.phone,
          email: customer.email ?? null,
          address,
          productName: product.title,
          color: item.color,
          size: item.size,
          eventDate: item.date,
          price: priceStr,
          status: 'Ödeme Yapıyor',
          orderDate,
          paymentMethod: 'Online',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Sipariş oluşturma hatası:', error);
        if (orderIds.length > 0) {
          await supabase
            .from('siparisler')
            .delete()
            .in('id', orderIds)
            .eq('status', 'Ödeme Yapıyor');
        }
        return NextResponse.json(
          { success: false, error: error.message, orderIds: [] },
          { status: 500 }
        );
      }
      if (data) orderIds.push(data.id);
    }

    return NextResponse.json({
      success: true,
      orderIds,
      message: 'Siparişler oluşturuldu',
    });
  } catch (error: unknown) {
    console.error('POST /api/create-pending-orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası', orderIds: [] },
      { status: 500 }
    );
  }
}
