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
      // apns-priority 10 + push-type alert şart: contentAvailable ile başlıksız
      // gönderimde FCM önceliği 5'e düşürür ve iOS bildirimi erteler/eler
      // (Android'e düşüp iOS'a düşmeyen giriş bildirimlerinin nedeni buydu).
      headers: { 'apns-push-type': 'alert', 'apns-priority': '10' },
      payload: { aps: { sound: 'default', badge: 1 } },
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
  items?: Array<{ product_name: string; event_date: string }>;
}): Promise<void> {
  const { getAllActiveFcmTokens, clearFcmToken } = await import('./devices');
  const devices = await getAllActiveFcmTokens();
  if (devices.length === 0) return;

  getFirebaseApp();

  // 'YYYY-MM-DD' → 'DD.MM.YYYY' (geçersiz format olduğu gibi bırakılır)
  const fmtDate = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
  };

  const itemLines = (payload.items ?? []).map(
    (it) => `${it.product_name} — ${fmtDate(it.event_date)}`
  );
  const body = [payload.customerName, ...itemLines].join('\n');
  const title = `🛍 Yeni Sipariş · ${Math.round(payload.totalPrice)} TL`;

  const message = (token: string) => ({
    token,
    notification: { title, body },
    data: {
      type: 'new_order',
      conversationId: payload.conversationId,
      customerName: payload.customerName,
    },
    apns: {
      // Android'deki özel sesli kanalın (ipek arp) iOS karşılığı — ses dosyası
      // Uygulama/ios/Runner/siparis_bildirim.wav olarak bundle'a eklendi.
      headers: { 'apns-push-type': 'alert', 'apns-priority': '10' },
      payload: {
        aps: { sound: 'siparis_bildirim.wav', badge: 1, contentAvailable: true },
      },
    },
    android: {
      priority: 'high' as const,
      // Uygulamanın oluşturduğu özel sesli kanal (ipek arp) — arka planda
      // OS bildirimi bu kanaldan gösterir; kanal yoksa varsayılana düşer.
      notification: {
        sound: 'siparis_bildirim',
        channelId: 'orders_channel_v2',
        priority: 'high' as const,
      },
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
      // bkz. sendLoginApprovalPushToUser — başlıksız contentAvailable iOS'ta
      // önceliği 5'e düşürüp bildirimi ertelettiriyordu.
      headers: { 'apns-push-type': 'alert', 'apns-priority': '10' },
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
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
