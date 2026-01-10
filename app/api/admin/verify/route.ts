// Render uyumluluğu için Node.js runtime ve dynamic rendering zorla
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

// GET: Token doğrulama (client-side kontrol için)
export async function GET(request: NextRequest) {
  try {
    // Runtime'da import
    const { verifyAdminJWT, getTokenFromCookie } = await import('@/app/lib/jwt-utils');

    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { valid: false },
        { status: 200 }
      );
    }

    const payload = await verifyAdminJWT(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        valid: true,
        email: payload.email,
        expiresAt: payload.exp * 1000,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify hatası:', error);
    return NextResponse.json(
      { valid: false },
      { status: 200 }
    );
  }
}
