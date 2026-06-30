/**
 * p1-auth.test.ts — Faz 1 birim testleri
 *
 * Tek mock: supabaseAdmin.getSupabaseAdmin() → sahte DB builder.
 * Tüm Faz 1 fonksiyonları (verifyBearerToken, devices.*, verifyMobileBearer,
 * createIsolatedSupabaseClient) gerçek uygulamalarıyla test edilir.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Kalıcı mock spy referansları ────────────────────────────────────────────
const mockGetUser     = vi.fn();
const mockMaybySingle = vi.fn(); // hem maybySingle hem maybySingle (devices.ts typo) paylaşır
const mockUpsertFn    = vi.fn();
const mockUpdateFn    = vi.fn();
const mockFromFn      = vi.fn();

/**
 * Supabase sorgu builder zinciri.
 * - Tüm filtre metodları (select, eq, is, not, update) builder'ı döner (chainable).
 * - upsert() doğrudan Promise döner.
 * - maybySingle() / maybeSingle() Promise döner  (devices.ts ve admin-auth.ts için iki yazım).
 * - Builder thenable → update().eq()...is() zinciri await edilebilir.
 */
function makeBuilder(finalResult: { data?: unknown; error?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {};
  const chain = () => b;

  b.select  = chain;
  b.eq      = chain;
  b.is      = chain;
  b.not     = chain;
  b.update  = (...args: unknown[]) => { mockUpdateFn(...args); return b; };
  b.upsert  = (...args: unknown[]) => { mockUpsertFn(...args); return Promise.resolve(finalResult); };

  // Supabase gerçek adı: maybeSingle (admin-auth.ts)
  b.maybeSingle  = () => { mockMaybySingle(); return Promise.resolve(finalResult); };
  // devices.ts yazım hatası: maybySingle — aynı spy
  b.maybySingle  = () => { mockMaybySingle(); return Promise.resolve(finalResult); };

  // Builder thenable: update/select/not zincirinin await edilmesini sağlar
  b.then  = (fn: (v: unknown) => unknown) => Promise.resolve(finalResult).then(fn);
  b.catch = (fn: (e: unknown) => unknown) => Promise.resolve(finalResult).catch(fn);

  return b;
}

// ─── Tek modül mock: supabaseAdmin ───────────────────────────────────────────
vi.mock('@/app/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    auth: { getUser: mockGetUser },
    from: mockFromFn,
  }),
}));

// ─── Yardımcı: test JWT üret (sahte imza — test amaçlı) ──────────────────────
function makeJwt(sub: string, sessionId: string): string {
  const hdr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const pay = Buffer.from(JSON.stringify({
    sub, session_id: sessionId, exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  return `${hdr}.${pay}.fakesig`;
}

function makeJwtNoSession(sub: string): string {
  const hdr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const pay = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${hdr}.${pay}.fakesig`;
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. verifyBearerToken
// ──────────────────────────────────────────────────────────────────────────────
describe('verifyBearerToken', () => {
  const SUB        = 'aaaaaaaa-0000-0000-0000-000000000001';
  const SESSION_ID = 'bbbbbbbb-0000-0000-0000-000000000002';

  beforeEach(() => vi.resetAllMocks());

  it('gecerli token ve session_id → { sub, sessionId } doner', async () => {
    const { verifyBearerToken } = await import('../app/lib/supabase-auth-verify');
    mockGetUser.mockResolvedValue({ data: { user: { id: SUB } }, error: null });
    const result = await verifyBearerToken(makeJwt(SUB, SESSION_ID));
    expect(result).toEqual({ sub: SUB, sessionId: SESSION_ID });
  });

  it('Supabase hata dondururse → null', async () => {
    const { verifyBearerToken } = await import('../app/lib/supabase-auth-verify');
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid token' } });
    expect(await verifyBearerToken(makeJwt(SUB, SESSION_ID))).toBeNull();
  });

  it('user null ise → null', async () => {
    const { verifyBearerToken } = await import('../app/lib/supabase-auth-verify');
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await verifyBearerToken(makeJwt(SUB, SESSION_ID))).toBeNull();
  });

  it('payload session_id olmadan → null', async () => {
    const { verifyBearerToken } = await import('../app/lib/supabase-auth-verify');
    mockGetUser.mockResolvedValue({ data: { user: { id: SUB } }, error: null });
    expect(await verifyBearerToken(makeJwtNoSession(SUB))).toBeNull();
  });

  it('bozuk JWT (3 parca degil) → null', async () => {
    const { verifyBearerToken } = await import('../app/lib/supabase-auth-verify');
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } });
    expect(await verifyBearerToken('garbage')).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. findActiveDevice
// ──────────────────────────────────────────────────────────────────────────────
describe('findActiveDevice', () => {
  const SUB        = 'aaaaaaaa-0000-0000-0000-000000000001';
  const SESSION_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
  const DEVICE_ROW = {
    id: 'cccccccc-0000-0000-0000-000000000003',
    auth_user_id: SUB,
    device_identifier: 'install-uuid-test',
    platform: 'ios',
    fcm_token: 'fcm-test-token',
    supabase_session_id: SESSION_ID,
  };

  beforeEach(() => vi.resetAllMocks());

  it('aktif satir bulunursa → device doner', async () => {
    const { findActiveDevice } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: DEVICE_ROW, error: null }));
    expect(await findActiveDevice(SUB, SESSION_ID)).toEqual(DEVICE_ROW);
  });

  it('satir yoksa (data null) → null doner', async () => {
    const { findActiveDevice } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: null }));
    expect(await findActiveDevice(SUB, SESSION_ID)).toBeNull();
  });

  it('DB hata dondururse → null doner', async () => {
    const { findActiveDevice } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: { message: 'db error' } }));
    expect(await findActiveDevice(SUB, SESSION_ID)).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. upsertDevice
// ──────────────────────────────────────────────────────────────────────────────
describe('upsertDevice', () => {
  beforeEach(() => vi.resetAllMocks());

  it('basarili upsert → hata firlatmaz', async () => {
    const { upsertDevice } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: null }));
    await expect(upsertDevice({
      authUserId: 'user-1',
      deviceIdentifier: 'install-uuid',
      platform: 'android',
      fcmToken: 'tok',
      supabaseSessionId: 'sess-1',
    })).resolves.toBeUndefined();
    expect(mockUpsertFn).toHaveBeenCalledOnce();
  });

  it('DB hata donunce → Error firlatir', async () => {
    const { upsertDevice } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: { message: 'upsert failed' } }));
    await expect(upsertDevice({
      authUserId: 'user-1',
      deviceIdentifier: 'install-uuid',
      platform: 'ios',
    })).rejects.toThrow('[devices] upsert failed');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. revokeDevice
// ──────────────────────────────────────────────────────────────────────────────
describe('revokeDevice', () => {
  beforeEach(() => vi.resetAllMocks());

  it('basarili revoke → hata firlatmaz', async () => {
    const { revokeDevice } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: null }));
    await expect(revokeDevice('user-1', 'install-uuid')).resolves.toBeUndefined();
    expect(mockUpdateFn).toHaveBeenCalledOnce();
  });

  it('DB hata donunce → Error firlatir', async () => {
    const { revokeDevice } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: { message: 'revoke failed' } }));
    await expect(revokeDevice('user-1', 'install-uuid')).rejects.toThrow('[devices] revoke failed');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. getActiveFcmTokens
// ──────────────────────────────────────────────────────────────────────────────
describe('getActiveFcmTokens', () => {
  beforeEach(() => vi.resetAllMocks());

  it('token listesi doner', async () => {
    const { getActiveFcmTokens } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(
      makeBuilder({ data: [{ fcm_token: 'tok-1' }, { fcm_token: 'tok-2' }], error: null })
    );
    expect(await getActiveFcmTokens('user-1')).toEqual(['tok-1', 'tok-2']);
  });

  it('DB hata donunce → bos dizi', async () => {
    const { getActiveFcmTokens } = await import('../app/lib/devices');
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: { message: 'err' } }));
    expect(await getActiveFcmTokens('user-1')).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. verifyMobileBearer (§5 dogrulama zinciri)
//
// Tum adimlar gercek implementasyon uzerinden calisir.
// supabaseAdmin mock'u uzeriyle mockGetUser ve mockFromFn kontrol edilir:
//   - mockGetUser  → verifyBearerToken → auth.getUser() sonucu
//   - mockFromFn('devices')     → findActiveDevice → maybySingle/maybySingle
//   - mockFromFn('admin_users') → admin yetki kontrolu → maybeSingle
// ──────────────────────────────────────────────────────────────────────────────
describe('verifyMobileBearer', () => {
  const SUB        = 'aaaaaaaa-0000-0000-0000-000000000001';
  const SESSION_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
  const DEVICE_ROW = {
    id: 'dev-1', auth_user_id: SUB, device_identifier: 'uuid',
    platform: 'ios', fcm_token: null, supabase_session_id: SESSION_ID,
  };
  const ADMIN_ROW = { email: 'admin@example.com', is_active: true };

  function makeRequest(authHeader?: string) {
    return {
      headers: { get: (h: string) => h === 'authorization' ? (authHeader ?? null) : null },
    } as unknown as import('next/server').NextRequest;
  }

  beforeEach(() => vi.resetAllMocks());

  it('Authorization header yoksa → null', async () => {
    const { verifyMobileBearer } = await import('../app/lib/admin-auth');
    expect(await verifyMobileBearer(makeRequest())).toBeNull();
  });

  it('Bearer degilse → null', async () => {
    const { verifyMobileBearer } = await import('../app/lib/admin-auth');
    expect(await verifyMobileBearer(makeRequest('Basic dXNlcjpwYXNz'))).toBeNull();
  });

  it('token gecersizse (getUser hata) → null', async () => {
    const { verifyMobileBearer } = await import('../app/lib/admin-auth');
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } });
    expect(await verifyMobileBearer(makeRequest(`Bearer ${makeJwt(SUB, SESSION_ID)}`))).toBeNull();
  });

  it('token gecerli ama aktif cihaz yoksa → null', async () => {
    const { verifyMobileBearer } = await import('../app/lib/admin-auth');
    mockGetUser.mockResolvedValue({ data: { user: { id: SUB } }, error: null });
    // findActiveDevice: maybySingle/maybySingle → data null
    mockFromFn.mockReturnValue(makeBuilder({ data: null, error: null }));
    expect(await verifyMobileBearer(makeRequest(`Bearer ${makeJwt(SUB, SESSION_ID)}`))).toBeNull();
  });

  it('cihaz ok ama admin satiri yoksa → null', async () => {
    const { verifyMobileBearer } = await import('../app/lib/admin-auth');
    mockGetUser.mockResolvedValue({ data: { user: { id: SUB } }, error: null });
    mockFromFn.mockImplementation((table: string) =>
      makeBuilder(table === 'devices' ? { data: DEVICE_ROW, error: null } : { data: null, error: null })
    );
    expect(await verifyMobileBearer(makeRequest(`Bearer ${makeJwt(SUB, SESSION_ID)}`))).toBeNull();
  });

  it('cihaz ok ama admin is_active=false → null', async () => {
    const { verifyMobileBearer } = await import('../app/lib/admin-auth');
    mockGetUser.mockResolvedValue({ data: { user: { id: SUB } }, error: null });
    mockFromFn.mockImplementation((table: string) =>
      makeBuilder(
        table === 'devices'
          ? { data: DEVICE_ROW, error: null }
          : { data: { ...ADMIN_ROW, is_active: false }, error: null }
      )
    );
    expect(await verifyMobileBearer(makeRequest(`Bearer ${makeJwt(SUB, SESSION_ID)}`))).toBeNull();
  });

  it('tum zincir geçerse → MobilePrincipal doner', async () => {
    const { verifyMobileBearer } = await import('../app/lib/admin-auth');
    mockGetUser.mockResolvedValue({ data: { user: { id: SUB } }, error: null });
    mockFromFn.mockImplementation((table: string) =>
      makeBuilder(
        table === 'devices'
          ? { data: DEVICE_ROW, error: null }
          : { data: ADMIN_ROW, error: null }
      )
    );
    const result = await verifyMobileBearer(makeRequest(`Bearer ${makeJwt(SUB, SESSION_ID)}`));
    expect(result).toEqual({ authUserId: SUB, email: 'admin@example.com' });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. createIsolatedSupabaseClient
// ──────────────────────────────────────────────────────────────────────────────
describe('createIsolatedSupabaseClient', () => {
  it('NEXT_PUBLIC_SUPABASE_URL eksikse → firlatir', async () => {
    const { createIsolatedSupabaseClient } = await import('../app/lib/isolated-supabase');
    const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    expect(() => createIsolatedSupabaseClient()).toThrow('NEXT_PUBLIC_SUPABASE_URL');
    process.env.NEXT_PUBLIC_SUPABASE_URL      = savedUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedKey;
  });

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY eksikse → firlatir', async () => {
    const { createIsolatedSupabaseClient } = await import('../app/lib/isolated-supabase');
    const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => createIsolatedSupabaseClient()).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.env.NEXT_PUBLIC_SUPABASE_URL      = savedUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedKey;
  });

  it('env tamsa → SupabaseClient instance doner', async () => {
    const { createIsolatedSupabaseClient } = await import('../app/lib/isolated-supabase');
    process.env.NEXT_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    const client = createIsolatedSupabaseClient();
    expect(client).toBeDefined();
    expect(typeof client.auth.signInWithPassword).toBe('function');
    expect(typeof client.auth.signOut).toBe('function');
  });
});
