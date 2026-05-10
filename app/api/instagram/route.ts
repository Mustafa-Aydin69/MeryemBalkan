export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('instagram_feed')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(15);

  if (error) {
    return NextResponse.json({ posts: [] });
  }

  return NextResponse.json({ posts: data || [] });
}
