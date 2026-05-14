export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { processPayment } from '@/app/lib/processPayment';

/**
 * Iyzico sends HMAC-SHA256(secretKey, rawBody), Base64-encoded, in x-iyzi-signature header.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.IYZICO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] IYZICO_WEBHOOK_SECRET tanımlı değil — istek reddedildi');
    return false;
  }
  if (!signatureHeader) {
    console.error('[webhook] x-iyzi-signature header eksik');
    return false;
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-iyzi-signature');

    if (!verifySignature(rawBody, signature)) {
      console.error('[webhook] imza doğrulaması başarısız');
      // Return 200 to prevent Iyzico from retrying with a bad secret
      return NextResponse.json({ received: false, error: 'invalid_signature' }, { status: 200 });
    }

    // Parse token — Iyzico sends form-encoded or JSON
    let token = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(rawBody);
        token = typeof json.token === 'string' ? json.token.trim() : '';
      } catch {
        return NextResponse.json({ received: true });
      }
    } else {
      // application/x-www-form-urlencoded (default for Iyzico HPP webhook)
      const params = new URLSearchParams(rawBody);
      token = (params.get('token') || '').trim();
    }

    if (!token) {
      // Non-payment webhook event (e.g. subscription update) — acknowledge and ignore
      console.log('[webhook] token bulunamadı, event yoksayıldı. payload=%s', rawBody.slice(0, 150));
      return NextResponse.json({ received: true });
    }

    console.log('[webhook] token=%s', token.slice(0, 12) + '...');

    const result = await processPayment(token, { source: 'webhook' });
    console.log('[webhook] result=%s token=%s', result, token.slice(0, 12) + '...');

    // Always 200 — a non-200 causes Iyzico to retry indefinitely
    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error('POST /api/payment/webhook error:', err);
    return NextResponse.json({ received: true, error: 'internal' }, { status: 200 });
  }
}
