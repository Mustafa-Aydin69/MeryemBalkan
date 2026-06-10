export const runtime = 'nodejs';

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set');

  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
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
