export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, secret } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const expectedSecret = process.env.DEVICE_REGISTER_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    await supabase.from('fcm_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('fcm_tokens').insert({ token });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
