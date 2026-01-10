import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_CONFIG } from '@/app/lib/admin-config';

// POST: Admin logout
export async function POST(request: NextRequest) {
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
    maxAge: 0, // Hemen sil
  });

  return response;
}

