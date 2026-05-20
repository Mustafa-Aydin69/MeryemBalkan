import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.hoisted ensures these exist before vi.mock factories run (which are hoisted above imports).
const { mockRetrieve, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockRetrieve: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

// Mocks must be declared before the module import (vi.mock is hoisted by Vitest).
vi.mock('@/app/lib/iyzipayClient', () => ({
  getIyzipayClient: () => ({ checkoutForm: { retrieve: mockRetrieve } }),
  getIyzipayLocale: () => 'tr',
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
  },
}));

vi.mock('@/app/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom, rpc: mockRpc }),
}));

vi.mock('@/app/lib/logPaymentEvent', () => ({
  logPaymentEvent: vi.fn().mockResolvedValue(undefined),
}));

import { processPayment } from '../app/lib/processPayment';

// ── Test data ──────────────────────────────────────────────────────────────────

const SESSION = {
  conversation_id: 'conv-test-123',
  total_price: '500',
  cart_items: [
    { productId: '1_var', color: 'Kırmızı', size: 'M', date: '2025-08-15' },
  ],
  customer: {
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    phone: '05001234567',
    email: 'ayse@test.com',
  },
  shipping_address: {
    address: 'Test Sokak No:1',
    district: 'Çankaya',
    city: 'Ankara',
    postalCode: '06000',
  },
  shipping_cost: '50',
};

const PRODUCT = { id: 1, price: 450, title: 'Test Abiye' };

// ── Builder factory ────────────────────────────────────────────────────────────
// Creates a Supabase query builder that is both chainable and awaitable.
function makeBuilder(result: { data?: unknown; error?: unknown } = {}) {
  const response = { data: result.data ?? null, error: result.error ?? null };
  const resolved = Promise.resolve(response);

  const chain: Record<string, unknown> = {
    single: vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  };

  for (const m of ['select', 'update', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'insert']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  return chain;
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  process.env.EMAIL_USER = 'admin@test.com';
  process.env.EMAIL_PASSWORD = 'test-password';
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('processPayment — Iyzico failure path', () => {
  it('returns "failed" when Iyzico status is not success', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'failure', paymentStatus: 'FAILURE', errorCode: '10051' })
    );

    const result = await processPayment('test-token');
    expect(result).toBe('failed');
  });

  it('returns "failed" when Iyzico paymentStatus is not SUCCESS', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'INIT_WAITING', paidPrice: '0' })
    );

    const result = await processPayment('test-token');
    expect(result).toBe('failed');
  });

  it('returns "failed" when paidPrice is zero', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '0' })
    );

    const result = await processPayment('test-token');
    expect(result).toBe('failed');
  });

  it('returns "error" when Iyzico throws', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: Error, res: null) => void) =>
        cb(new Error('Iyzico connection timeout'), null)
    );

    const result = await processPayment('test-token');
    expect(result).toBe('error');
  });
});

describe('processPayment — session claim failures', () => {
  it('returns "already_processed" when session is already processed', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    // Claim returns [] (already processed by another request)
    mockFrom.mockImplementationOnce(() => makeBuilder({ data: [], error: null }));
    // Check returns existing session with processed=true
    mockFrom.mockImplementationOnce(() => makeBuilder({ data: { processed: true } }));

    const result = await processPayment('test-token');
    expect(result).toBe('already_processed');
  });

  it('returns "failed" when session is not found or expired', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    // Claim returns []
    mockFrom.mockImplementationOnce(() => makeBuilder({ data: [], error: null }));
    // Check returns no session (not found / expired)
    mockFrom.mockImplementationOnce(() => makeBuilder({ data: null }));

    const result = await processPayment('test-token');
    expect(result).toBe('failed');
  });

  it('returns "error" when session claim DB call fails', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    mockFrom.mockImplementationOnce(() =>
      makeBuilder({ data: null, error: { message: 'DB connection failed' } })
    );

    const result = await processPayment('test-token');
    expect(result).toBe('error');
  });
});

describe('processPayment — price validation', () => {
  it('returns "failed" when paid amount is less than expected', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        // paidPrice (400) < total_price (500) → underpayment
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '400' })
    );

    mockFrom.mockImplementationOnce(() =>
      makeBuilder({ data: [SESSION], error: null })
    );

    const result = await processPayment('test-token');
    expect(result).toBe('failed');
  });
});

describe('processPayment — happy path', () => {
  function setupHappyPath() {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    mockFrom
      .mockImplementationOnce(() => makeBuilder({ data: [SESSION], error: null })) // claim
      .mockImplementationOnce(() => makeBuilder({ data: [PRODUCT] }))               // urunler
      .mockImplementationOnce(() => makeBuilder({ data: [] }))                      // orders_items conflict
      .mockImplementationOnce(() => makeBuilder({ data: null }));                   // orders dedup

    mockRpc.mockResolvedValue({ error: null });
  }

  it('returns "success" when everything succeeds', async () => {
    setupHappyPath();
    const result = await processPayment('test-token');
    expect(result).toBe('success');
  });

  it('calls rpc create_confirmed_order with correct params', async () => {
    setupHappyPath();
    await processPayment('test-token');
    expect(mockRpc).toHaveBeenCalledWith('create_confirmed_order', expect.objectContaining({
      p_conversation_id: 'conv-test-123',
      p_customer_name: 'Ayşe Yılmaz',
      p_phone: '05001234567',
      p_email: 'ayse@test.com',
    }));
  });
});

describe('processPayment — conflict and duplicate order', () => {
  it('returns "failed" when date conflict exists for a product', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    mockFrom
      .mockImplementationOnce(() => makeBuilder({ data: [SESSION], error: null })) // claim
      .mockImplementationOnce(() => makeBuilder({ data: [PRODUCT] }))               // urunler
      .mockImplementationOnce(() => makeBuilder({ data: [{ id: 99 }] }));           // conflict found!

    const result = await processPayment('test-token');
    expect(result).toBe('failed');
  });

  it('returns "already_processed" on RPC unique constraint violation (23505)', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    mockFrom
      .mockImplementationOnce(() => makeBuilder({ data: [SESSION], error: null }))
      .mockImplementationOnce(() => makeBuilder({ data: [PRODUCT] }))
      .mockImplementationOnce(() => makeBuilder({ data: [] }))
      .mockImplementationOnce(() => makeBuilder({ data: null }));

    mockRpc.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const result = await processPayment('test-token');
    expect(result).toBe('already_processed');
  });

  it('returns "failed" when RPC reports a conflict error via advisory lock', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    mockFrom
      .mockImplementationOnce(() => makeBuilder({ data: [SESSION], error: null }))
      .mockImplementationOnce(() => makeBuilder({ data: [PRODUCT] }))
      .mockImplementationOnce(() => makeBuilder({ data: [] }))
      .mockImplementationOnce(() => makeBuilder({ data: null }));

    mockRpc.mockResolvedValue({
      error: { code: 'P0001', message: 'conflict:"Test Abiye"' },
    });

    const result = await processPayment('test-token');
    expect(result).toBe('failed');
  });

  it('returns "already_processed" when order already exists before RPC', async () => {
    mockRetrieve.mockImplementationOnce(
      (_: unknown, cb: (err: null, res: unknown) => void) =>
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', paidPrice: '500' })
    );

    mockFrom
      .mockImplementationOnce(() => makeBuilder({ data: [SESSION], error: null }))
      .mockImplementationOnce(() => makeBuilder({ data: [PRODUCT] }))
      .mockImplementationOnce(() => makeBuilder({ data: [] }))
      // Dedup check finds an existing order
      .mockImplementationOnce(() => makeBuilder({ data: { id: 'existing-order-id' } }));

    const result = await processPayment('test-token');
    expect(result).toBe('already_processed');
  });
});
