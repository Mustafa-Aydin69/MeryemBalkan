import { getSupabaseAdmin } from './supabaseAdmin';

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 dakika

function generateUUID(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  return [...array]
    .map((b, i) =>
      [4, 6, 8, 10].includes(i)
        ? '-' + b.toString(16).padStart(2, '0')
        : b.toString(16).padStart(2, '0')
    )
    .join('');
}

export async function createTwoFASession(email: string, otp: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const sessionId = generateUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await supabase.from('otp_store').upsert(
    {
      email: email.toLowerCase(),
      otp,
      expires_at: expiresAt,
      attempts: 0,
      verified: false,
      approved: false,
      verification_token: sessionId,
      verification_token_expires_at: expiresAt,
    },
    { onConflict: 'email' }
  );

  return sessionId;
}

export async function getSession(sessionId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('otp_store')
    .select('email, approved, verified, expires_at')
    .eq('verification_token', sessionId)
    .single();
  return data ?? null;
}

export async function approveSession(sessionId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('otp_store')
    .select('expires_at')
    .eq('verification_token', sessionId)
    .single();

  if (!data || data.expires_at < now) return false;

  await supabase
    .from('otp_store')
    .update({ approved: true })
    .eq('verification_token', sessionId);

  return true;
}

export async function rejectSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('otp_store').delete().eq('verification_token', sessionId);
}

export async function verifySessionOTP(sessionId: string, otp: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('otp_store')
    .select('email, otp, approved, expires_at, verified')
    .eq('verification_token', sessionId)
    .single();

  if (!data) return null;
  if (data.expires_at < now) return null;
  if (!data.approved) return null;
  if (data.verified) return null;
  if (data.otp !== otp) return null;

  await supabase
    .from('otp_store')
    .update({ verified: true })
    .eq('verification_token', sessionId);

  return data.email;
}

export async function completeSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('otp_store').delete().eq('verification_token', sessionId);
}

export async function getDeviceFcmToken(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('fcm_tokens')
    .select('token')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  return data?.token ?? null;
}
