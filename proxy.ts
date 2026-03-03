import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// JWT doğrulama için basit implementasyon (Edge Runtime uyumlu)
async function verifyJWTInProxy(token: string, secret: string): Promise<{
  valid: boolean;
  payload?: {
    email: string;
    role: string;
    otp_verified: boolean;
    exp: number;
  };
}> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [headerEncoded, payloadEncoded, signatureProvided] = parts;

    // Base64URL decode
    const base64UrlDecode = (str: string): string => {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) {
        str += '=';
      }
      return atob(str);
    };

    // Base64URL encode
    const base64UrlEncode = (str: string): string => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    // İmza doğrulama
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${headerEncoded}.${payloadEncoded}`)
    );
    const expectedSignature = base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    if (signatureProvided !== expectedSignature) {
      return { valid: false };
    }

    // Payload parse
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));

    // Süre kontrolü
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin giriş key kontrolü - ör: /kH3qWNsLhXenlHAs6EcZjeanfbEMmeupSY8phWghVBw=
  const adminEntryKey = process.env.ADMIN_ENTRY_KEY;
  if (adminEntryKey && pathname === `/${adminEntryKey}`) {
    // Key doğru - ana sayfaya yönlendir ve cookie set et
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('admin_entry_verified', 'true', {
      httpOnly: false, // Client-side'da okunabilmeli
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 5, // 5 dakika geçerli
    });
    return response;
  }

  // Admin route'ları kontrol et
  if (pathname.startsWith('/admin')) {
    // Sadece açıkça izin verilmişse kimlik doğrulama olmadan /admin (varsayılan: false)
    const allowDevWithoutAuth = process.env.ALLOW_DEV_ADMIN_WITHOUT_AUTH === 'true';
    if (allowDevWithoutAuth) {
      return NextResponse.next();
    }

    // Cookie'den token al
    const token = request.cookies.get('admin_token')?.value;

    // Token yoksa ana sayfaya yönlendir
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Production'da secret zorunlu; yoksa güvenlik riski
    const secret = process.env.ADMIN_JWT_SECRET;
    if (process.env.NODE_ENV === 'production' && (!secret || secret.trim() === '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    const secretToUse = secret?.trim() || 'dev-fallback-secret-do-not-use-in-production';
    const result = await verifyJWTInProxy(token, secretToUse);

    // Token geçersizse
    if (!result.valid || !result.payload) {
      // Cookie'yi temizle ve yönlendir
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('admin_token');
      return response;
    }

    // Role kontrolü
    if (result.payload.role !== 'admin') {
      // 404 döndür - admin olmadığını belli etme
      return NextResponse.rewrite(new URL('/404', request.url));
    }

    // OTP doğrulama kontrolü
    if (!result.payload.otp_verified) {
      // Logout ve yönlendir
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('admin_token');
      return response;
    }

    // Token geçerli - devam et
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Hangi route'larda çalışacağını belirt
export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)', // Tüm route'ları yakala (statik dosyalar hariç)
  ],
};
