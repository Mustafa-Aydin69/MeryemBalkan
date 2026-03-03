/**
 * Central admin authentication and rate limiting.
 * - getTokenFromRequest: read admin_token cookie
 * - verifyAdminToken: validate JWT and return payload or null
 * - enforceAdminRateLimit: token + IP rate limit; returns 429 response or null (allowed)
 * Use in all /api/admin/* and destructive endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AdminJWTPayload } from './jwt-utils';
import { ADMIN_CONFIG } from './admin-config';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIP,
} from './rate-limiter';

const COOKIE_NAME = ADMIN_CONFIG.COOKIE.NAME;

export function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );
  return cookies[COOKIE_NAME] || null;
}

/**
 * Verify admin JWT and return payload or null. Uses central config (no fallback in production).
 */
export async function verifyAdminToken(request: NextRequest): Promise<AdminJWTPayload | null> {
  const { verifyAdminJWT } = await import('@/app/lib/jwt-utils');
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminJWT(token);
}

/**
 * Enforce rate limit for admin API: by token (email) and by IP.
 * Returns NextResponse with 429 if limited, or null if allowed.
 * Call after verifyAdminToken; pass the payload.
 */
export async function enforceAdminRateLimit(
  request: NextRequest,
  payload: AdminJWTPayload
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const email = payload.email;

  const byUser = checkRateLimit(email, 'ADMIN_API', ip);
  const byIP = checkRateLimit(ip, 'ADMIN_API_IP', ip);

  if (!byUser.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', retryAfter: byUser.retryAfter },
      { status: 429, headers: byUser.retryAfter ? { 'Retry-After': String(byUser.retryAfter) } : {} }
    );
  }
  if (!byIP.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', retryAfter: byIP.retryAfter },
      { status: 429, headers: byIP.retryAfter ? { 'Retry-After': String(byIP.retryAfter) } : {} }
    );
  }

  incrementRateLimit(email, 'ADMIN_API', ip);
  incrementRateLimit(ip, 'ADMIN_API_IP', ip);
  return null;
}
