// Ödeme onayı API - Server-side
// Service Role Key ile RLS bypass eder

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs gerekli' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Siparişleri "Hazırlanıyor" durumuna güncelle
    const { data, error } = await supabase
      .from('siparisler')
      .update({ status: 'Hazırlanıyor' })
      .in('id', orderIds)
      .eq('status', 'Ödeme Yapıyor')
      .select('id');

    if (error) {
      console.error('Sipariş güncelleme hatası:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
      message: 'Siparişler onaylandı'
    });
  } catch (error: any) {
    console.error('POST /api/confirm-payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
