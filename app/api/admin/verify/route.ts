import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_CONFIG } from '@/app/lib/admin-config';
import { verifyAdminJWT, getTokenFromCookie } from '@/app/lib/jwt-utils';

// GET: Token doğrulama (client-side kontrol için)
export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { valid: false },
      { status: 200 }
    );
  }
}

