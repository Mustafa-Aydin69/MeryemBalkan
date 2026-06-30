import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_FLOW_PATHS = [
  '/api/admin/auth/login',
  '/api/admin/auth/approve',
  '/api/admin/auth/reject',
  '/api/admin/auth/pre-approve',
  '/api/admin/auth/status',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/admin/* koruma (auth-flow rotaları hariç)
  if (pathname.startsWith('/api/admin/')) {
    if (!AUTH_FLOW_PATHS.some(p => pathname.startsWith(p))) {
      const hasCookie = !!request.cookies.get('admin_session')?.value;
      const hasBearer = request.headers.get('authorization')?.startsWith('Bearer ');
      if (!hasCookie && !hasBearer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // Admin giriş key kontrolü
  const adminEntryKey = process.env.ADMIN_ENTRY_KEY;
  if (adminEntryKey && pathname === `/${adminEntryKey}`) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('admin_entry_verified', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 5,
    });
    return response;
  }

  // /admin sayfası koruması — admin_session cookie yoksa anasayfaya yönlendir
  if (pathname.startsWith('/admin')) {
    if (process.env.ALLOW_DEV_ADMIN_WITHOUT_AUTH === 'true') {
      return NextResponse.next();
    }

    const hasSession = !!request.cookies.get('admin_session')?.value;
    if (!hasSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
