// Render uyumluluğu için Node.js runtime ve dynamic rendering zorla
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

// POST: Admin logout
export async function POST(request: NextRequest) {
  try {
    // Runtime'da import
    const { ADMIN_CONFIG } = await import('@/app/lib/admin-config');

    const response = NextResponse.json(
      { success: true, message: 'Çıkış yapıldı' },
      { status: 200 }
    );

    // Cookie'yi temizle
    response.cookies.set(ADMIN_CONFIG.COOKIE.NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Çıkış yapılamadı' },
      { status: 500 }
    );
  }
}
