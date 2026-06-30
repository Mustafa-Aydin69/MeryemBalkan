/**
 * devices.ts
 *
 * devices tablosu CRUD — cihaz kaydı, aktif-cihaz doğrulaması, iptal.
 *
 * Güvenlik notu (§2.3, düzeltme 6):
 *   device_identifier YALNIZCA kurulum etiketi / upsert anahtarıdır.
 *   Yetki bu alana DAYANMAZ. Yetki zinciri: doğrulanmış token sub +
 *   session_id + aktif devices satırı + admin_users.is_active (§5).
 *
 * KULLANIM KISITI: yalnızca server-side (API routes / lib).
 */

import { getSupabaseAdmin } from './supabaseAdmin';

export interface ActiveDevice {
  id: string;
  auth_user_id: string;
  device_identifier: string;
  platform: string;
  fcm_token: string | null;
  supabase_session_id: string | null;
}

export interface UpsertDeviceParams {
  authUserId: string;
  deviceIdentifier: string;
  platform: 'ios' | 'android';
  fcmToken?: string | null;
  supabaseSessionId?: string | null;
}

/**
 * §5 zorunlu doğrulama zinciri — adım 3:
 * auth_user_id = sub AND supabase_session_id = token claim AND revoked_at IS NULL
 * Satır yoksa veya iptalliyse null döner → çağıran 401 döner.
 */
export async function findActiveDevice(
  authUserId: string,
  sessionId: string
): Promise<ActiveDevice | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('devices')
    .select('id, auth_user_id, device_identifier, platform, fcm_token, supabase_session_id')
    .eq('auth_user_id', authUserId)
    .eq('supabase_session_id', sessionId)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return data as ActiveDevice;
}

/**
 * Cihaz kaydı / güncelleme (Faz 3 register-device endpoint'i tarafından kullanılır).
 * (auth_user_id, device_identifier) unique kısıtı üzerinden upsert.
 * Diğer cihazların satırları DOKUNULMAZ (kısıt 11).
 */
export async function upsertDevice(params: UpsertDeviceParams): Promise<void> {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await db.from('devices').upsert(
    {
      auth_user_id: params.authUserId,
      device_identifier: params.deviceIdentifier,
      platform: params.platform,
      fcm_token: params.fcmToken ?? null,
      supabase_session_id: params.supabaseSessionId ?? null,
      last_seen_at: now,
    },
    { onConflict: 'auth_user_id,device_identifier' }
  );

  if (error) throw new Error(`[devices] upsert failed: ${error.message}`);
}

/**
 * Belirli bir cihazı anında iptal eder (§7 uygulama-seviyesi iptal).
 * devices.revoked_at set edilir → o cihazın tüm sonraki istekleri
 * findActiveDevice'de null döner → 401.
 * Diğer cihazlar etkilenmez.
 */
export async function revokeDevice(
  authUserId: string,
  deviceIdentifier: string
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from('devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId)
    .eq('device_identifier', deviceIdentifier)
    .is('revoked_at', null);

  if (error) throw new Error(`[devices] revoke failed: ${error.message}`);
}

/**
 * Kullanıcının tüm aktif cihazlarının FCM token'larını döner.
 * Push göndermek için (revoked_at IS NULL olan tüm cihazlar).
 */
export async function getActiveFcmTokens(authUserId: string): Promise<string[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('devices')
    .select('fcm_token')
    .eq('auth_user_id', authUserId)
    .is('revoked_at', null)
    .not('fcm_token', 'is', null);

  if (error || !data) return [];
  return data.map((d) => d.fcm_token as string).filter(Boolean);
}

/**
 * Geçersiz FCM token'ı temizler (FCM registration-token-not-registered hatası sonrası).
 * Yalnızca fcm_token kolonu null'a set edilir; satır SİLİNMEZ (PERF-05).
 */
export async function clearFcmToken(authUserId: string, fcmToken: string): Promise<void> {
  const db = getSupabaseAdmin();
  await db
    .from('devices')
    .update({ fcm_token: null })
    .eq('auth_user_id', authUserId)
    .eq('fcm_token', fcmToken)
    .is('revoked_at', null);
}

/**
 * Tüm aktif cihazların FCM token'larını döner (tüm adminler).
 * Sipariş push gibi tüm cihazlara gönderilmesi gereken durumlarda kullanılır.
 */
export async function getAllActiveFcmTokens(): Promise<Array<{ authUserId: string; fcmToken: string }>> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('devices')
    .select('auth_user_id, fcm_token')
    .is('revoked_at', null)
    .not('fcm_token', 'is', null);

  if (error || !data) return [];
  return data
    .filter((d) => d.fcm_token)
    .map((d) => ({ authUserId: d.auth_user_id as string, fcmToken: d.fcm_token as string }));
}
