// Bekleyen sipariş oluşturma API - Server-side
// Service Role Key ile RLS bypass eder

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  color: string;
  size: string;
  date: string;
  image: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer, address } = body as {
      items: CartItem[];
      customer: CustomerInfo;
      address: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items gerekli' },
        { status: 400 }
      );
    }

    if (!customer || !customer.firstName || !customer.lastName || !customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bilgileri gerekli' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const orderIds: number[] = [];

    for (const item of items) {
      const { data, error } = await supabase
        .from('siparisler')
        .insert({
          customerName: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          email: customer.email || null,
          address: address,
          productName: item.title,
          color: item.color,
          size: item.size,
          eventDate: item.date,
          price: `${item.price} TL`,
          status: 'Ödeme Yapıyor',
          orderDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Online',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Sipariş oluşturma hatası:', error);
        // Önceki siparişleri temizle
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

      if (data) {
        orderIds.push(data.id);
      }
    }

    return NextResponse.json({
      success: true,
      orderIds,
      message: 'Siparişler oluşturuldu'
    });
  } catch (error: any) {
    console.error('POST /api/create-pending-orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', orderIds: [] },
      { status: 500 }
    );
  }
}
