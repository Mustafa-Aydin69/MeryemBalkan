// Admin Product Status Bulk Update API
// Toplu ürün durumu değiştirme

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

// PATCH: Toplu ürün durumu güncelle
export async function PATCH(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const { urunIds, status } = body;

    // Validation
    if (!urunIds || !Array.isArray(urunIds) || urunIds.length === 0) {
      return NextResponse.json(
        { error: 'urunIds array gerekli ve boş olmamalı' },
        { status: 400 }
      );
    }

    if (!status || !['Yayında', 'Yayında Değil'].includes(status)) {
      return NextResponse.json(
        { error: 'status "Yayında" veya "Yayında Değil" olmalı' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Toplu güncelleme
    const { data, error } = await supabase
      .from('urunler')
      .update({ status })
      .in('id', urunIds)
      .select('id');

    if (error) {
      console.error('Toplu güncelleme hatası:', error);
      return NextResponse.json(
        { error: 'Ürünler güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} ürün başarıyla güncellendi`,
      updatedCount: data?.length || 0,
    });
  } catch (error) {
    console.error('Status API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
