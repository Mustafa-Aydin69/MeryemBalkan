// Admin Orders API - Server-side only
// RLS bypass için Service Role Key kullanır

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

// Flatten orders_items + orders join into the shape the admin UI expects
function flattenItem(item: any) {
  const o = item.orders ?? {};
  return {
    id: item.id,
    orderId: item.order_id ?? '',
    conversationId: o.conversation_id ?? '',
    customerName: o.customer_name ?? '',
    phone: o.phone ?? '',
    email: o.email ?? '',
    address: o.address ?? '',
    productName: item.product_name,
    color: item.color,
    size: item.size,
    eventDate: item.event_date,
    orderDate: o.order_date ?? '',
    price: `${item.price} TL`,
    status: item.status,
    shippingCode: item.shipping_code ?? '',
    paymentMethod: o.payment_method ?? '',
  };
}

// GET: Tüm siparişleri getir (opsiyonel status / productName filtresi)
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
      .from('orders_items')
      .select(`
        id,
        order_id,
        product_name,
        color,
        size,
        event_date,
        price,
        status,
        shipping_code,
        orders!inner(
          conversation_id,
          customer_name,
          phone,
          email,
          address,
          order_date,
          payment_method
        )
      `);

    if (status) {
      query = query.eq('status', status);
    }
    if (productName) {
      query = query.eq('product_name', productName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Siparişler alınamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: (data ?? []).map(flattenItem) });
  } catch (error: any) {
    console.error('GET /api/admin/siparisler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Yeni sipariş oluştur (admin manuel)
// Expects flat body matching the old siparisler shape:
// { customerName, phone, email, address, productName, color, size, eventDate, orderDate, price, status, paymentMethod }
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

    const conversationId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        conversation_id: conversationId,
        customer_name: body.customerName ?? '',
        phone: body.phone ?? '',
        email: body.email || null,
        address: body.address ?? '',
        order_date: body.orderDate || new Date().toISOString().split('T')[0],
        payment_method: body.paymentMethod || 'Admin',
        shipping_cost: 0,
        total_price: 0,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Sipariş başlığı oluşturulamadı:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const rawPrice = typeof body.price === 'string'
      ? parseFloat(body.price.replace(/[^0-9.]/g, '')) || 0
      : Number(body.price) || 0;

    const { data, error } = await supabase
      .from('orders_items')
      .insert({
        order_id: order.id,
        product_name: body.productName ?? '',
        color: body.color ?? '',
        size: body.size ?? '',
        event_date: body.eventDate,
        price: rawPrice,
        status: body.status || 'Hazırlanıyor',
      })
      .select();

    if (error) {
      console.error('Sipariş kalemi oluşturulamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('POST /api/admin/siparisler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Sipariş güncelle (status ve/veya shippingCode)
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

    const allowedUpdates: Record<string, unknown> = {};
    if (typeof updates.status === 'string' && updates.status.trim()) {
      allowedUpdates.status = updates.status.trim();
    }
    if ('shippingCode' in updates) {
      const v = updates.shippingCode;
      const trimmed = v != null && typeof v === 'string' ? v.trim() : '';
      if (trimmed) allowedUpdates.shipping_code = trimmed;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'Geçerli güncelleme alanı yok' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const itemId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (Number.isNaN(itemId) || itemId < 1) {
      return NextResponse.json({ error: 'Geçersiz sipariş id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders_items')
      .update(allowedUpdates)
      .eq('id', itemId)
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
