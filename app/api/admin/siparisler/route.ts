// Admin Orders API - Server-side only
// RLS bypass için Service Role Key kullanır

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

// GET: Tüm siparişleri getir (opsiyonel status filtresi)
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productName = searchParams.get('productName');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('siparisler')
      .select('id, customerName, address, productName, size, color, eventDate, orderDate, status, price, phone, email, shippingCode, paymentMethod');

    // Status filtresi
    if (status) {
      query = query.eq('status', status);
    }

    // Product name filtresi
    if (productName) {
      query = query.eq('productName', productName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Siparişler alınamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/admin/siparisler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Yeni sipariş oluştur
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('siparisler')
      .insert(body)
      .select();

    if (error) {
      console.error('Sipariş oluşturulamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('POST /api/admin/siparisler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Sipariş güncelle
export async function PUT(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }

    // Sadece izin verilen alanları güncelle; boş shippingCode -> null
    const allowedUpdates: Record<string, unknown> = {};
    if (typeof updates.status === 'string' && updates.status.trim()) {
      allowedUpdates.status = updates.status.trim();
    }
    // shippingCode: sadece dolu değer verilmişse güncelle; null/boş göndermek NOT NULL sütunda 500'e yol açabilir
    if ('shippingCode' in updates) {
      const v = updates.shippingCode;
      const trimmed = v != null && typeof v === 'string' ? v.trim() : '';
      if (trimmed) allowedUpdates.shippingCode = trimmed;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'Geçerli güncelleme alanı yok' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const orderId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (Number.isNaN(orderId) || orderId < 1) {
      return NextResponse.json({ error: 'Geçersiz sipariş id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('siparisler')
      .update(allowedUpdates)
      .eq('id', orderId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message || 'Veritabanı hatası' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Beklenmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
