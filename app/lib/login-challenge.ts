import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateMatchCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export type LoginChallenge = {
  session_id: string;
  auth_user_id: string | null;
  email: string;
  match_code: string;
  match_attempts: number;
  approved: boolean;
  pre_approved: boolean;
  browser_nonce_hash: string | null;
  ip_address: string | null;
  expires_at: string;
};

export async function createLoginChallenge(
  email: string,
  authUserId: string | null,
  ip: string,
  nonceHash: string | null = null
): Promise<{ sessionId: string; matchCode: string }> {
  const supabase = getSupabase();
  const sessionId = crypto.randomUUID();
  const matchCode = generateMatchCode();

  const { error } = await supabase.from('login_challenges').insert({
    session_id: sessionId,
    auth_user_id: authUserId,
    email,
    match_code: matchCode,
    ip,
    browser_nonce_hash: nonceHash,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });

  if (error) throw new Error(`login_challenges insert hatası: ${error.message}`);
  return { sessionId, matchCode };
}

export async function getLoginChallenge(sessionId: string): Promise<LoginChallenge | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('login_challenges')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  return (data as LoginChallenge) ?? null;
}

export async function approveLoginChallenge(
  sessionId: string,
  authUserId: string,
  submittedMatchCode: string
): Promise<{ success: boolean; reason?: string }> {
  const supabase = getSupabase();

  const { data: challenge } = await supabase
    .from('login_challenges')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (!challenge) return { success: false, reason: 'not_found' };

  const now = new Date().toISOString();
  if (challenge.expires_at < now) {
    await supabase.from('login_challenges').delete().eq('session_id', sessionId);
    return { success: false, reason: 'expired' };
  }

  if (challenge.approved) return { success: false, reason: 'already_approved' };

  if (challenge.auth_user_id !== authUserId) return { success: false, reason: 'unauthorized' };

  const MAX_ATTEMPTS = 3;
  const newAttempts = (challenge.match_attempts ?? 0) + 1;

  if (challenge.match_code !== submittedMatchCode) {
    if (newAttempts >= MAX_ATTEMPTS) {
      await supabase.from('login_challenges').delete().eq('session_id', sessionId);
      return { success: false, reason: 'locked' };
    }
    await supabase
      .from('login_challenges')
      .update({ match_attempts: newAttempts })
      .eq('session_id', sessionId);
    return { success: false, reason: 'wrong_code' };
  }

  await supabase
    .from('login_challenges')
    .update({ approved: true, match_attempts: newAttempts })
    .eq('session_id', sessionId);

  return { success: true };
}

export async function preApproveLoginChallenge(
  sessionId: string,
  authUserId: string
): Promise<boolean> {
  const supabase = getSupabase();

  const { data: challenge } = await supabase
    .from('login_challenges')
    .select('auth_user_id, expires_at, approved')
    .eq('session_id', sessionId)
    .single();

  if (!challenge) return false;
  if (challenge.expires_at < new Date().toISOString()) return false;
  if (challenge.auth_user_id !== authUserId) return false;
  if (challenge.approved) return false;

  const { error } = await supabase
    .from('login_challenges')
    .update({ pre_approved: true })
    .eq('session_id', sessionId);

  return !error;
}

export async function rejectLoginChallenge(
  sessionId: string,
  authUserId: string
): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('login_challenges')
    .delete()
    .eq('session_id', sessionId)
    .eq('auth_user_id', authUserId);
}

export async function deleteLoginChallenge(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('login_challenges').delete().eq('session_id', sessionId);
}
