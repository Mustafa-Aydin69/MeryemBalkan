export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[cleanup] CRON_SECRET tanımlı değil');
    return false;
  }
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Expired + never processed — abandoned payments, safe to delete
  const { count: abandonedCount, error: err1 } = await supabase
    .from('payment_sessions')
    .delete({ count: 'exact' })
    .eq('processed', false)
    .lt('expires_at', now);

  if (err1) {
    console.error('[cleanup] abandoned silme hatası:', err1.message);
    return NextResponse.json({ error: err1.message }, { status: 500 });
  }

  // 2. Processed sessions older than 90 days — audit window passed
  const { count: oldCount, error: err2 } = await supabase
    .from('payment_sessions')
    .delete({ count: 'exact' })
    .eq('processed', true)
    .lt('created_at', cutoff90d);

  if (err2) {
    console.error('[cleanup] eski session silme hatası:', err2.message);
    return NextResponse.json({ error: err2.message }, { status: 500 });
  }

  console.log('[cleanup] tamamlandı — abandoned=%d old_processed=%d', abandonedCount, oldCount);

  return NextResponse.json({
    ok: true,
    deleted: {
      abandoned: abandonedCount ?? 0,
      old_processed: oldCount ?? 0,
    },
  });
}
