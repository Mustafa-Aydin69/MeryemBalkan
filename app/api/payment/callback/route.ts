export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, incrementRateLimit, getClientIP } from '@/app/lib/rate-limiter';
import { processPayment } from '@/app/lib/processPayment';
import { captureError } from '@/app/lib/error-tracking';

function resultUrl(req: NextRequest, status: 'success' | 'failed' | 'error'): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'localhost';
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
  return `${base}/odeme-sonuc?status=${status}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rl = await checkRateLimit(ip, 'PAYMENT_CALLBACK', ip);
  if (!rl.allowed) {
    return NextResponse.redirect(resultUrl(req, 'error'), { status: 303 });
  }
  await incrementRateLimit(ip, 'PAYMENT_CALLBACK', ip);

  try {
    const formData = await req.formData();
    const rawToken = formData.get('token');
    const token = typeof rawToken === 'string' ? rawToken.trim() : '';
    if (!token) {
      return NextResponse.redirect(resultUrl(req, 'failed'), { status: 303 });
    }

    const result = await processPayment(token, { source: 'callback', ip });

    if (result === 'success' || result === 'already_processed') {
      return NextResponse.redirect(resultUrl(req, 'success'), { status: 303 });
    }
    if (result === 'error') {
      return NextResponse.redirect(resultUrl(req, 'error'), { status: 303 });
    }
    return NextResponse.redirect(resultUrl(req, 'failed'), { status: 303 });
  } catch (err) {
    console.error('POST /api/payment/callback error:', err);
    captureError({ error: err, source: 'callback', severity: 'fatal', requestPath: '/api/payment/callback' }).catch(() => {});
    return NextResponse.redirect(resultUrl(req, 'error'), { status: 303 });
  }
}
