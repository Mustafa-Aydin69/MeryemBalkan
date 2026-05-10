// Müşteri siparişleri API - Server-side
// Service Role Key ile RLS bypass eder

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email gerekli' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Geçersiz email formatı' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Step 1: find all order IDs for this email
    const { data: orderRows, error: orderErr } = await supabase
      .from('orders')
      .select('id')
      .eq('email', email);

    if (orderErr) {
      console.error('Siparişler alınamadı:', orderErr);
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const orderIds = orderRows.map((o: any) => o.id);

    // Step 2: fetch all items with their parent order info
    const { data: items, error: itemErr } = await supabase
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
        created_at,
        orders(
          customer_name,
          phone,
          email,
          address,
          order_date,
          payment_method
        )
      `)
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });

    if (itemErr) {
      console.error('Sipariş kalemleri alınamadı:', itemErr);
      return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }

    const data = (items ?? []).map((item: any) => {
      const o = item.orders ?? {};
      return {
        id: item.id,
        orderId: item.order_id,
        productName: item.product_name,
        color: item.color,
        size: item.size,
        eventDate: item.event_date,
        price: `${item.price} TL`,
        status: item.status,
        shippingCode: item.shipping_code ?? '',
        orderDate: o.order_date ?? '',
        customerName: o.customer_name ?? '',
        phone: o.phone ?? '',
        email: o.email ?? '',
        address: o.address ?? '',
        paymentMethod: o.payment_method ?? '',
      };
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('POST /api/my-orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
