// Kupon ön-doğrulama endpoint'i — public, rate-limited.
// Sepet önizlemesi için kullanılır; bağlayıcı değil.
// Bağlayıcı doğrulama /api/payment/create'te yapılır.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { checkRateLimit, incrementRateLimit, getClientIP } from '@/app/lib/rate-limiter';
import { validateCoupon } from '@/app/lib/validateCoupon';

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

const ValidateCouponSchema = z.object({
  code: z.string().min(1).max(50).transform(v => v.trim()),
  cartItems: z.array(
    z.object({
      productId: z.union([z.string(), z.number()]).transform(String),
    })
  ).min(1).max(20),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit — brute-force engeli (IP bazlı)
  const ip = getClientIP(req);
  const rateLimit = await checkRateLimit(ip, 'COUPON_VALIDATE', ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { valid: false, error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? 60) } }
    );
  }
  await incrementRateLimit(ip, 'COUPON_VALIDATE', ip);

  try {
    const body = await req.json();
    const parsed = ValidateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ valid: false, error: 'Geçersiz istek.' }, { status: 400 });
    }
    const { code, cartItems, email } = parsed.data;

    // Ürün fiyatlarını DB'den çek — client tutarına asla güvenilmez
    const supabase = getSupabaseAdmin();
    const productIdNumbers = [
      ...new Set(
        cartItems
          .map(i => parseInt(String(i.productId).split('_')[0], 10))
          .filter(n => !isNaN(n) && n > 0)
      ),
    ];

    if (productIdNumbers.length === 0) {
      return NextResponse.json({ valid: false, error: 'Geçersiz ürün.' }, { status: 400 });
    }

    const { data: products } = await supabase
      .from('urunler')
      .select('id, price')
      .in('id', productIdNumbers);

    if (!products || products.length === 0) {
      return NextResponse.json({ valid: false, error: 'Ürün bilgileri alınamadı.' }, { status: 400 });
    }

    const productMap = new Map<number, number>();
    for (const p of products) {
      productMap.set(p.id as number, parseDBPrice(p.price));
    }

    let itemsTotal = 0;
    for (const item of cartItems) {
      const id = parseInt(String(item.productId).split('_')[0], 10);
      itemsTotal += productMap.get(id) ?? 0;
    }

    // Doğrulama
    const result = await validateCoupon(code, itemsTotal, email);

    if (!result.ok) {
      return NextResponse.json({ valid: false, error: result.reason });
    }

    return NextResponse.json({
      valid: true,
      discount: result.discount,
      code: result.code,
    });
  } catch (err: unknown) {
    console.error('POST /api/coupon/validate error:', err);
    return NextResponse.json({ valid: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}
