export const runtime = 'nodejs';

import { getSupabaseAdmin } from './supabaseAdmin';
import { sendEmail, renderEmailShell } from './email-service';

export type Severity = 'warning' | 'error' | 'fatal';

export interface CaptureErrorParams {
  error: unknown;
  source: string;
  /** Varsayılan: 'error'. 'fatal' her zaman e-posta alarmı tetikler. */
  severity?: Severity;
  /** PII içermemeli — maskePII uygulanır. */
  context?: Record<string, unknown>;
  requestPath?: string;
  /** true geçilirse severity'den bağımsız alarm gönderilir. */
  alert?: boolean;
}

// E-posta, uzun base64-benzeri token/JWT ve HMAC imzalarını maskeler.
export function maskPII(text: string): string {
  return text
    // e-posta adresleri
    .replace(/[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/g, '[email]')
    // uzun alfanümerik diziler (>= 40 kar.) — JWT/token/hash
    .replace(/[A-Za-z0-9+/=_-]{40,}/g, '[token]');
}

// Spam koruması: (source+mesaj imzası) → son alarm gönderme zamanı (ms)
// Per-instance best-effort; insert her zaman yapılır, yalnızca e-posta throttle'lanır.
const _alertThrottle = new Map<string, number>();
const ALERT_THROTTLE_MS = 10 * 60 * 1000; // 10 dakika

function shouldSendAlert(sig: string): boolean {
  const last = _alertThrottle.get(sig);
  if (!last) return true;
  return Date.now() - last > ALERT_THROTTLE_MS;
}

function markAlertSent(sig: string): void {
  _alertThrottle.set(sig, Date.now());
}

function alertRecipient(): string {
  return (
    process.env.ERROR_ALERT_EMAIL ||
    (process.env.ADMIN_WHITELIST_EMAILS ?? '').split(',')[0]?.trim() ||
    process.env.EMAIL_USER ||
    ''
  );
}

/**
 * Sunucu hatasını `error_events` tablosuna kaydeder.
 * Fatal veya `alert:true` ise e-posta alarmı gönderir (10 dk throttle).
 *
 * **Fire-and-forget** — çağıran `await` etmeden veya `.catch()` ile çağırabilir;
 * bu fonksiyon asla ana akışı çökertmez/bloklamaz.
 */
export async function captureError(p: CaptureErrorParams): Promise<void> {
  try {
    const err = p.error;
    const rawMessage = err instanceof Error ? err.message : String(err);
    const rawStack   = err instanceof Error ? (err.stack ?? '') : '';
    const severity   = p.severity ?? 'error';

    const message = maskPII(rawMessage);
    const stack   = maskPII(rawStack).slice(0, 4096);

    // context serialize + maskele
    let contextJson: Record<string, unknown> | null = null;
    if (p.context) {
      try {
        contextJson = JSON.parse(maskPII(JSON.stringify(p.context)));
      } catch {
        contextJson = { _serializeError: true };
      }
    }

    const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown';

    // DB kaydı
    const supabase = getSupabaseAdmin();
    let insertedId: string | null = null;
    try {
      const { data } = await supabase
        .from('error_events')
        .insert({
          source:       p.source,
          severity,
          message,
          stack:        stack || null,
          context:      contextJson,
          request_path: p.requestPath ?? null,
          env,
        })
        .select('id')
        .single();
      insertedId = data?.id ?? null;
    } catch (dbErr) {
      console.error('[error-tracking] DB yazma hatası:', dbErr);
    }

    // Alarm koşulu: fatal veya zorla alert
    const needsAlert = severity === 'fatal' || p.alert === true;
    if (!needsAlert) return;

    const recipient = alertRecipient();
    if (!recipient) {
      console.warn('[error-tracking] ERROR_ALERT_EMAIL ayarlı değil, alarm e-postası atlandı');
      return;
    }

    const sig = `${p.source}:${message.slice(0, 120)}`;
    if (!shouldSendAlert(sig)) return; // throttle

    try {
      const content = `
        <h2 style="margin: 0 0 16px; color: #c0392b; font-size: 20px;">🚨 Kritik Hata Alarmı</h2>
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#333;">
          <tr><td style="padding:6px 0; font-weight:600; width:120px;">Kaynak</td><td>${escapeHtml(p.source)}</td></tr>
          <tr><td style="padding:6px 0; font-weight:600;">Önem</td><td>${escapeHtml(severity)}</td></tr>
          <tr><td style="padding:6px 0; font-weight:600;">Ortam</td><td>${escapeHtml(env)}</td></tr>
          ${p.requestPath ? `<tr><td style="padding:6px 0; font-weight:600;">Path</td><td>${escapeHtml(p.requestPath)}</td></tr>` : ''}
          <tr><td style="padding:6px 0; font-weight:600;">Mesaj</td><td style="font-family:monospace; background:#f5f5f5; padding:4px 8px; border-radius:4px;">${escapeHtml(message)}</td></tr>
          ${contextJson ? `<tr><td style="padding:6px 0; font-weight:600;">Bağlam</td><td style="font-family:monospace; font-size:12px; background:#f5f5f5; padding:4px 8px; border-radius:4px; white-space:pre-wrap;">${escapeHtml(JSON.stringify(contextJson, null, 2))}</td></tr>` : ''}
        </table>
        ${stack ? `<p style="margin:16px 0 6px; font-weight:600; font-size:13px; color:#666;">Stack trace (kısaltılmış)</p>
        <pre style="font-size:11px; background:#f5f5f5; padding:10px; border-radius:4px; overflow:auto; max-height:200px; white-space:pre-wrap;">${escapeHtml(stack.slice(0, 1500))}</pre>` : ''}
        <p style="margin:20px 0 0; font-size:12px; color:#999;">error_events.id: ${insertedId ?? 'kaydedilemedi'} — ${new Date().toISOString()}</p>
      `;
      await sendEmail({
        to: recipient,
        subject: `[Meryem Balkan] Kritik Hata — ${p.source}`,
        html: renderEmailShell(content),
        fromName: 'Meryem Balkan Hata İzleme',
      });
      markAlertSent(sig);

      // alerted = true işaretle
      if (insertedId) {
        await supabase.from('error_events').update({ alerted: true }).eq('id', insertedId);
      }
    } catch (mailErr) {
      console.error('[error-tracking] alarm e-postası gönderilemedi:', mailErr);
    }
  } catch (outerErr) {
    // captureError'ın kendisi asla çökmemeli
    console.error('[error-tracking] beklenmeyen hata:', outerErr);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
