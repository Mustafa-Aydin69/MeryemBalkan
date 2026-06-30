export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { processPayment } from '@/app/lib/processPayment';
import { captureError } from '@/app/lib/error-tracking';

type SignatureResult = 'ok' | 'invalid' | 'no_secret';

// Verifies HMAC-SHA256(secret, rawBody) against the x-iyzi-signature header.
// Returns a discriminated result so the caller can apply an env-aware policy:
//   - 'no_secret' → IYZICO_WEBHOOK_SECRET not configured (caller decides per environment)
//   - 'invalid'   → secret configured but header missing or signature mismatch → reject
//   - 'ok'        → signature valid
// processPayment still validates the token against Iyzico's API (primary security);
// this is a defense-in-depth layer.
function verifySignature(rawBody: string, signatureHeader: string | null): SignatureResult {
  const secret = process.env.IYZICO_WEBHOOK_SECRET;
  if (!secret) return 'no_secret';
  if (!signatureHeader) return 'invalid';
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader)) ? 'ok' : 'invalid';
  } catch {
    return 'invalid';
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-iyzi-signature');

    const sigResult = verifySignature(rawBody, signature);

    if (sigResult === 'no_secret') {
      // Env-aware fail-closed: in production a missing secret is a misconfiguration —
      // refuse loudly (503) so it gets fixed; in dev skip verification to keep local testing working.
      if (process.env.NODE_ENV === 'production') {
        console.error('[webhook] IYZICO_WEBHOOK_SECRET prod\'da ayarlı değil — fail-closed (503), işleme alınmadı');
        return NextResponse.json({ received: false, error: 'webhook_not_configured' }, { status: 503 });
      }
      console.warn('[webhook] IYZICO_WEBHOOK_SECRET yok (dev) — imza doğrulaması atlandı');
      // dev → fall through and process
    } else if (sigResult === 'invalid') {
      // Secret configured but header missing or signature mismatch → reject, do not process.
      console.error('[webhook] imza doğrulaması başarısız — 401, reddedildi');
      return NextResponse.json({ received: false, error: 'invalid_signature' }, { status: 401 });
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
    captureError({ error: err, source: 'webhook', severity: 'fatal', requestPath: '/api/payment/webhook' }).catch(() => {});
    return NextResponse.json({ received: true, error: 'internal' }, { status: 200 });
  }
}
