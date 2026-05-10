export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

async function auth(request: NextRequest) {
  const payload = await verifyAdminToken(request);
  if (!payload) return null;
  const rateLimitRes = await enforceAdminRateLimit(request, payload);
  if (rateLimitRes) return rateLimitRes;
  return true;
}

// GET — tüm postları listele
export async function GET(request: NextRequest) {
  const check = await auth(request);
  if (check !== true) return check ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from('instagram_feed')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data || [] });
}

// POST — yeni fotoğraf ekle
export async function POST(request: NextRequest) {
  const check = await auth(request);
  if (check !== true) return check ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { image_path, instagram_link } = await request.json();
  if (!image_path) return NextResponse.json({ error: 'image_path gerekli' }, { status: 400 });

  // En yüksek sort_order'ı bul
  const { data: last } = await getSupabaseAdmin()
    .from('instagram_feed')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sort_order = (last?.sort_order ?? -1) + 1;

  const { data, error } = await getSupabaseAdmin()
    .from('instagram_feed')
    .insert({ image_path, sort_order, instagram_link: instagram_link || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

// DELETE — fotoğraf sil
export async function DELETE(request: NextRequest) {
  const check = await auth(request);
  if (check !== true) return check ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from('instagram_feed')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH — sıralama güncelle
export async function PATCH(request: NextRequest) {
  const check = await auth(request);
  if (check !== true) return check ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orders } = await request.json(); // [{ id, sort_order }]
  if (!Array.isArray(orders)) return NextResponse.json({ error: 'orders gerekli' }, { status: 400 });

  const updates = orders.map(({ id, sort_order }: { id: number; sort_order: number }) =>
    getSupabaseAdmin().from('instagram_feed').update({ sort_order }).eq('id', id)
  );

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}
