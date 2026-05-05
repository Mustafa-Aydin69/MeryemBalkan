export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

const BLOCKING_STATUSES = ['Hazırlanıyor', 'Kirada'];

function getDateRange(dateStr: string): { startDate: string; endDate: string } {
  const date = new Date(dateStr);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 7);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, productName, eventDate, cartItems } = body;

    const supabase = getSupabaseAdmin();

    if (action === 'checkProductStatus') {
      const realId = String(productId).split('_')[0];
      const parsedId = parseInt(realId, 10);
      if (isNaN(parsedId)) {
        return NextResponse.json({ isActive: false, productName: null });
      }
      const { data, error } = await supabase
        .from('urunler')
        .select('status, title')
        .eq('id', parsedId)
        .single();
      if (error || !data) {
        return NextResponse.json({ isActive: false, productName: null });
      }
      return NextResponse.json({ isActive: data.status === 'Yayında', productName: data.title });
    }

    if (action === 'checkSingleConflict') {
      const { startDate, endDate } = getDateRange(eventDate);
      const { data, error } = await supabase
        .from('orders_items')
        .select('id')
        .eq('product_name', productName)
        .in('status', BLOCKING_STATUSES)
        .gte('event_date', startDate)
        .lte('event_date', endDate);
      if (error) {
        console.error('Çakışma kontrolü hatası:', error);
        return NextResponse.json({ hasConflict: false, reason: '' });
      }
      if (data && data.length > 0) {
        return NextResponse.json({
          hasConflict: true,
          reason: 'Bu elbise istediğiniz tarihte başka bir müşteri tarafından kiralanmıştır. Lütfen farklı bir tarih seçiniz.',
        });
      }
      return NextResponse.json({ hasConflict: false, reason: '' });
    }

    if (action === 'checkCartConflicts') {
      const conflicts: { item: any; reason: string }[] = [];
      const validItems: any[] = [];

      for (const item of cartItems) {
        const realId = String(item.productId).split('_')[0];
        const parsedId = parseInt(realId, 10);

        let isActive = false;
        let productNameFromDB = item.title;

        if (!isNaN(parsedId)) {
          const { data: productData } = await supabase
            .from('urunler')
            .select('status, title')
            .eq('id', parsedId)
            .single();
          if (productData) {
            isActive = productData.status === 'Yayında';
            productNameFromDB = productData.title;
          }
        }

        if (!isActive) {
          conflicts.push({
            item,
            reason: `"${item.title}" ürünü artık mevcut değil veya yayından kaldırılmış.`,
          });
          continue;
        }

        const { startDate, endDate } = getDateRange(item.date);
        const { data: conflictData } = await supabase
          .from('orders_items')
          .select('id')
          .eq('product_name', productNameFromDB)
          .in('status', BLOCKING_STATUSES)
          .gte('event_date', startDate)
          .lte('event_date', endDate);

        if (conflictData && conflictData.length > 0) {
          conflicts.push({
            item,
            reason: 'Bu elbise istediğiniz tarihte başka bir müşteri tarafından kiralanmıştır. Lütfen farklı bir tarih seçiniz.',
          });
        } else {
          validItems.push(item);
        }
      }

      return NextResponse.json({ hasConflict: conflicts.length > 0, conflicts, validItems });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/check-conflict error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
