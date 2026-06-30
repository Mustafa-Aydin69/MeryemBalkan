export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .order('email', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }

    return NextResponse.json({ success: true, users: data });
  } catch (err) {
    console.error('GET /api/admin/users hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email gerekli' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from('admin_users')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    // Son aktif admin silinemez
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (count !== null && count <= 1) {
      return NextResponse.json(
        { error: 'Son aktif admin silinemez' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('email', email);

    if (error) {
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }

    if (existing?.auth_user_id) {
      await supabase.auth.admin.deleteUser(existing.auth_user_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/users hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const rateLimitResponse = await enforceAdminRateLimit(request, payload);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const { isValidEmail } = await import('@/app/lib/admin-config');
    if (!isValidEmail(email) || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre (min 8 karakter)' },
        { status: 400 }
      );
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Bu email zaten kayıtlı' },
        { status: 409 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      console.error('Supabase Auth kullanıcı oluşturma hatası:', authError);
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }

    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({ email, auth_user_id: authData.user.id, is_active: true });

    if (insertError) {
      console.error('Admin kullanıcı ekleme hatası:', insertError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/users hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
