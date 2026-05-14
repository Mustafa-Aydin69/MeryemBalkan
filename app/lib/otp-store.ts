import { getSupabaseAdmin } from './supabaseAdmin';

const OTP_EXPIRES_MS = 5 * 60 * 1000;
const VERIFICATION_TOKEN_EXPIRES_MS = 10 * 60 * 1000;

export function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 900000 + 100000).toString();
}

export async function storeOTP(email: string, code: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS).toISOString();
  await supabase.from('otp_store').upsert({
    email: email.toLowerCase(),
    otp: code,
    expires_at: expiresAt,
    attempts: 0,
    verified: false,
    verification_token: null,
    verification_token_expires_at: null,
  }, { onConflict: 'email' });
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const key = email.toLowerCase();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('otp_store')
    .select('otp, expires_at, verified')
    .eq('email', key)
    .single();

  if (!data) return false;
  if (data.verified) return false;
  if (data.expires_at < now) {
    await supabase.from('otp_store').delete().eq('email', key);
    return false;
  }
  if (data.otp !== code) return false;

  await supabase.from('otp_store').update({ verified: true }).eq('email', key);
  return true;
}

export async function clearOTP(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('otp_store').delete().eq('email', email.toLowerCase());
}

export async function createVerificationToken(email: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_MS).toISOString();

  await supabase.from('otp_store').update({
    verification_token: token,
    verification_token_expires_at: expiresAt,
  }).eq('email', email.toLowerCase());

  return token;
}

export async function validateVerificationToken(token: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('otp_store')
    .select('email, verification_token_expires_at')
    .eq('verification_token', token)
    .single();

  if (!data) return null;
  if (data.verification_token_expires_at < now) return null;

  return data.email;
}

export async function clearVerificationToken(token: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('otp_store').update({
    verification_token: null,
    verification_token_expires_at: null,
  }).eq('verification_token', token);
}
