export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

export async function PUT(request: NextRequest) {
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
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';

    const { isValidEmail } = await import('@/app/lib/admin-config');
    if (!isValidEmail(email) || !newPassword || newPassword.length < 8) {
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
      .select('auth_user_id')
      .eq('email', email)
      .single();

    if (!existing?.auth_user_id) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.auth_user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Şifre güncelleme hatası:', updateError);
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/admin/users/password hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
