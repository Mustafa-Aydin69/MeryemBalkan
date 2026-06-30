/**
 * isolated-supabase.ts
 *
 * Web login şifre doğrulaması için kullanılan IZOLE Supabase client.
 * Her çağrıda yeni bir instance döner — singleton DEĞİL.
 *
 * Neden izole?
 *   signInWithPassword() çağrısı geçici bir Supabase oturumu oluşturur.
 *   persistSession: false → bu oturum bellekte tutulmaz.
 *   Doğrulama bittikten hemen sonra çağıran kod signOut() ile
 *   geçici oturumu imha etmeli → orphan Supabase session kalmaz.
 *
 * KULLANIM KISITI: yalnızca server-side (API routes).
 * Tarayıcıya / mobil'e hiçbir token GÖNDERİLMEZ.
 * Service-role key KULLANILMAZ — anon key + kullanıcı kimlik bilgileri yeterli.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createIsolatedSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('[IsolatedSupabase] NEXT_PUBLIC_SUPABASE_URL is not defined');
  if (!anonKey) throw new Error('[IsolatedSupabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
