export const runtime = 'nodejs';

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { captureError } from './error-tracking';

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set');

  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}

/**
 * Kullanıcının tüm aktif cihazlarına push gönderir.
 * devices tablosunu okur. FCM registration-token-not-registered hatası → ilgili token temizlenir.
 */
export async function sendLoginApprovalPushToUser(
  authUserId: string | null,
  sessionId: string,
  fallbackFcmToken?: string | null
): Promise<void> {
  const { getActiveFcmTokens, clearFcmToken } = await import('./devices');

  let tokens: string[] = [];
  if (authUserId) {
    tokens = await getActiveFcmTokens(authUserId);
  }
  if (tokens.length === 0 && fallbackFcmToken) {
    tokens = [fallbackFcmToken];
  }
  if (tokens.length === 0) return;

  getFirebaseApp();

  const message = (token: string) => ({
    token,
    notification: {
      title: 'Giriş İsteği',
      body: 'Admin paneline giriş isteği var. Sen misin?',
    },
    data: { sessionId, type: 'login_approval' },
    apns: {
      payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } },
    },
    android: {
      priority: 'high' as const,
      notification: { sound: 'default', priority: 'high' as const },
    },
  });

  const results = await Promise.allSettled(
    tokens.map((t) => getMessaging().send(message(t)))
  );

  if (authUserId) {
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'rejected') {
        const code = (r.reason as { errorInfo?: { code?: string } })?.errorInfo?.code;
        if (code === 'messaging/registration-token-not-registered') {
          await clearFcmToken(authUserId, tokens[i]).catch(() => {});
        } else {
          console.error('FCM push hatası:', r.reason);
          captureError({ error: r.reason, source: 'fcm', severity: 'error', context: { code, sessionId } }).catch(() => {});
        }
      }
    }
  }
}

/**
 * Yeni sipariş oluştuğunda tüm aktif admin cihazlarına push gönderir.
 * Geçersiz token → clearFcmToken ile temizlenir.
 */
export async function sendNewOrderPushToAdmins(payload: {
  conversationId: string;
  customerName: string;
  totalPrice: number;
}): Promise<void> {
  const { getAllActiveFcmTokens, clearFcmToken } = await import('./devices');
  const devices = await getAllActiveFcmTokens();
  if (devices.length === 0) return;

  getFirebaseApp();

  const body = `${payload.customerName} · ${Math.round(payload.totalPrice)} TL`;

  const message = (token: string) => ({
    token,
    notification: { title: '🛍 Yeni Sipariş', body },
    data: {
      type: 'new_order',
      conversationId: payload.conversationId,
      customerName: payload.customerName,
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } },
    },
    android: {
      priority: 'high' as const,
      notification: { sound: 'default', priority: 'high' as const },
    },
  });

  const results = await Promise.allSettled(
    devices.map((d) => getMessaging().send(message(d.fcmToken)))
  );

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'rejected') {
      const code = (r.reason as { errorInfo?: { code?: string } })?.errorInfo?.code;
      if (code === 'messaging/registration-token-not-registered') {
        await clearFcmToken(devices[i].authUserId, devices[i].fcmToken).catch(() => {});
      } else {
        console.error('[fcm] sipariş push hatası:', r.reason);
        captureError({ error: r.reason, source: 'fcm', severity: 'error', context: { code, conversationId: payload.conversationId } }).catch(() => {});
      }
    }
  }
}

export async function sendLoginApprovalPush(fcmToken: string, sessionId: string): Promise<void> {
  getFirebaseApp();

  await getMessaging().send({
    token: fcmToken,
    notification: {
      title: 'Giriş İsteği',
      body: 'Admin paneline giriş isteği var. Sen misin?',
    },
    data: {
      sessionId,
      type: 'login_approval',
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          contentAvailable: true,
        },
      },
    },
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        priority: 'high' as const,
      },
    },
  });
}
