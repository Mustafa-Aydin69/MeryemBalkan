import { NextRequest } from 'next/server';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function checkCsrf(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return true;

  const origin = request.headers.get('origin') ?? '';
  const referer = request.headers.get('referer') ?? '';
  const source = origin || referer;

  const allowedRaw = process.env.ALLOWED_ORIGINS ?? '';
  const allowed = allowedRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    allowed.push('http://localhost:3000', 'http://0.0.0.0:3000');
  }

  if (!source) return false;

  return allowed.some(
    (base) => source === base || source.startsWith(base + '/')
  );
}
