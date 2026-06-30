// Next.js 15+ instrumentation hook — tüm sunucu rota hatalarını merkezi yakalar.
// Tek çağıran: Next.js runtime (otomatik). İmport gerekmez.

// no-op: gelecekte OpenTelemetry vb. init için kullanılabilir.
export async function register() {}

// onRequestError: bir API route veya server component beklenmedik hata fırlatırsa çağrılır.
// catch bloklarına ek, ağ katmanı hataları ve route-handler panic'leri için kapsamı genişletir.
export async function onRequestError(
  err: unknown,
  request: { path?: string; url?: string },
  context: { routerKind?: string; routePath?: string; [k: string]: unknown }
): Promise<void> {
  // Dinamik import — instrumentation modülü edge runtime'da da yüklenir;
  // error-tracking'i yalnızca Node runtime'da çek (getSupabaseAdmin edge'de çalışmaz).
  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    const { captureError } = await import('@/app/lib/error-tracking');
    await captureError({
      error: err,
      source: 'onRequestError',
      severity: 'error',
      requestPath: request?.path ?? request?.url,
      context: {
        routerKind:  context?.routerKind,
        routePath:   context?.routePath,
      },
    });
  }
}
