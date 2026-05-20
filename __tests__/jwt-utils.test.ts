import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createAdminJWT, verifyAdminJWT, getTokenFromCookie } from '../app/lib/jwt-utils';

beforeAll(() => {
  process.env.ADMIN_JWT_SECRET = 'test-jwt-secret-unit-tests';
});

afterAll(() => {
  delete process.env.ADMIN_JWT_SECRET;
});

describe('createAdminJWT', () => {
  it('creates a 3-part dot-separated JWT string', async () => {
    const token = await createAdminJWT('admin@test.com');
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    expect(parts.every(p => p.length > 0)).toBe(true);
  });

  it('encodes correct claims in payload', async () => {
    const token = await createAdminJWT('admin@test.com');
    const [, payloadB64] = token.split('.');
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      Math.ceil(payloadB64.length / 4) * 4, '='
    );
    const payload = JSON.parse(atob(padded));
    expect(payload.email).toBe('admin@test.com');
    expect(payload.role).toBe('admin');
    expect(payload.otp_verified).toBe(true);
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('header declares HS256 algorithm', async () => {
    const token = await createAdminJWT('admin@test.com');
    const [headerB64] = token.split('.');
    const padded = headerB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      Math.ceil(headerB64.length / 4) * 4, '='
    );
    const header = JSON.parse(atob(padded));
    expect(header.alg).toBe('HS256');
    expect(header.typ).toBe('JWT');
  });
});

describe('verifyAdminJWT', () => {
  it('returns payload for a valid token', async () => {
    const token = await createAdminJWT('admin@test.com');
    const payload = await verifyAdminJWT(token);
    expect(payload).not.toBeNull();
    expect(payload?.email).toBe('admin@test.com');
    expect(payload?.role).toBe('admin');
    expect(payload?.otp_verified).toBe(true);
  });

  it('returns null for a tampered signature', async () => {
    const token = await createAdminJWT('admin@test.com');
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.invalidsignatureXXXXXXXX`;
    const result = await verifyAdminJWT(tampered);
    expect(result).toBeNull();
  });

  it('returns null for an expired token', async () => {
    vi.useFakeTimers();
    const token = await createAdminJWT('admin@test.com');
    // Advance past JWT_EXPIRES_IN (60 * 60 = 1 hour)
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    const result = await verifyAdminJWT(token);
    vi.useRealTimers();
    expect(result).toBeNull();
  });

  it('returns null for a token with wrong secret', async () => {
    // Create a token, then verify with different secret env
    const token = await createAdminJWT('admin@test.com');
    const saved = process.env.ADMIN_JWT_SECRET;
    process.env.ADMIN_JWT_SECRET = 'different-secret';
    const result = await verifyAdminJWT(token);
    process.env.ADMIN_JWT_SECRET = saved;
    expect(result).toBeNull();
  });

  it('returns null for empty string', async () => {
    expect(await verifyAdminJWT('')).toBeNull();
  });

  it('returns null for token with only two parts', async () => {
    expect(await verifyAdminJWT('a.b')).toBeNull();
  });

  it('returns null for non-string input', async () => {
    // @ts-expect-error testing invalid input
    expect(await verifyAdminJWT(null)).toBeNull();
    // @ts-expect-error testing invalid input
    expect(await verifyAdminJWT(undefined)).toBeNull();
  });
});

describe('getTokenFromCookie', () => {
  it('extracts admin_token from a multi-cookie header', () => {
    const result = getTokenFromCookie('session=xyz; admin_token=my-token-value; other=abc');
    expect(result).toBe('my-token-value');
  });

  it('extracts admin_token when it is the only cookie', () => {
    expect(getTokenFromCookie('admin_token=only-token')).toBe('only-token');
  });

  it('returns null when admin_token is not present', () => {
    expect(getTokenFromCookie('other=xyz; session=abc')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(getTokenFromCookie(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getTokenFromCookie('')).toBeNull();
  });
});
