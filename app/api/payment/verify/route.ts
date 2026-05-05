export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import 'postman-request';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY    || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri:       process.env.IYZICO_BASE_URL   || '',
});

type Verdict = 'ok' | 'mismatch' | 'iyzico_failed' | 'not_found';

export async function GET(req: NextRequest) {
  const admin = await verifyAdminToken(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rateLimited = await enforceAdminRateLimit(req, admin);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get('token')?.trim() || '';
  const conversationIdParam = searchParams.get('conversation_id')?.trim() || '';

  if (!tokenParam && !conversationIdParam) {
    return NextResponse.json(
      { error: 'token veya conversation_id parametresi gerekli' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // 1. Resolve token — if conversation_id given, look up token from session
  let token = tokenParam;
  if (!token && conversationIdParam) {
    const { data: sessionRow } = await supabase
      .from('payment_sessions')
      .select('iyzico_token')
      .eq('conversation_id', conversationIdParam)
      .maybeSingle();

    if (!sessionRow?.iyzico_token) {
      // No Iyzico session — legacy or admin order. Check orders table for context.
      const { data: orderRow } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('conversation_id', conversationIdParam)
        .maybeSingle();

      return NextResponse.json({
        verdict: 'not_found' as Verdict,
        detail: orderRow
          ? 'Bu sipariş için Iyzico ödeme kaydı yok (legacy veya manuel sipariş)'
          : 'Bu conversation_id için kayıt bulunamadı',
        iyzico: null,
        db: { session: null, order: orderRow ?? null },
      });
    }
    token = sessionRow.iyzico_token;
  }

  // 2. Fetch session + order from DB in parallel
  const [sessionResult, iyzicoResult] = await Promise.all([
    supabase
      .from('payment_sessions')
      .select('conversation_id, processed, expires_at, total_price, iyzico_token, created_at')
      .eq('iyzico_token', token)
      .maybeSingle(),

    new Promise<{
      status?: string;
      paymentStatus?: string;
      paidPrice?: string;
      price?: string;
      conversationId?: string;
      paymentId?: string;
      errorCode?: string;
      errorMessage?: string;
      [k: string]: unknown;
    }>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(
        { locale: Iyzipay.LOCALE.TR, token },
        (err: Error | null, res: unknown) => {
          if (err) return reject(err);
          resolve(res as ReturnType<typeof resolve extends Promise<infer T> ? () => T : never>);
        }
      );
    }).catch((err: unknown) => {
      console.error('[verify] Iyzico retrieve hatası:', err);
      return null;
    }),
  ]);

  const session = sessionResult.data;

  // 3. If session found, also fetch order
  let order: { id: number; created_at: string } | null = null;
  if (session?.conversation_id) {
    const { data: orderRow } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('conversation_id', session.conversation_id)
      .maybeSingle();
    order = orderRow ?? null;
  }

  // 4. Determine verdict
  let verdict: Verdict;

  if (!iyzicoResult) {
    verdict = 'not_found';
  } else if (iyzicoResult.status !== 'success' || iyzicoResult.paymentStatus !== 'SUCCESS') {
    verdict = 'iyzico_failed';
  } else if (!order) {
    // Iyzico says success but we have no order — the dangerous blind spot
    verdict = 'mismatch';
  } else {
    verdict = 'ok';
  }

  console.log('[verify] verdict=%s token=%s conversation=%s',
    verdict,
    token.slice(0, 12) + '...',
    session?.conversation_id ?? conversationIdParam,
  );

  return NextResponse.json({
    verdict,
    iyzico: iyzicoResult ? {
      status:         iyzicoResult.status,
      paymentStatus:  iyzicoResult.paymentStatus,
      paidPrice:      iyzicoResult.paidPrice,
      price:          iyzicoResult.price,
      conversationId: iyzicoResult.conversationId,
      paymentId:      iyzicoResult.paymentId,
      errorCode:      iyzicoResult.errorCode,
      errorMessage:   iyzicoResult.errorMessage,
    } : null,
    db: {
      session: session ? {
        conversation_id: session.conversation_id,
        processed:       session.processed,
        expires_at:      session.expires_at,
        total_price:     session.total_price,
        created_at:      session.created_at,
      } : null,
      order: order ? {
        id:         order.id,
        created_at: order.created_at,
      } : null,
    },
  });
}
