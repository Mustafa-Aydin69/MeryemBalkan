// Admin Coupons [id] API — tekil kupon detayı (used_count rozeti için)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

// DELETE /api/admin/coupons/[id] — kalıcı silme (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      console.error('Kupon silinemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('DELETE /api/admin/coupons/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Kupon alınamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Kupon bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    console.error('GET /api/admin/coupons/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
