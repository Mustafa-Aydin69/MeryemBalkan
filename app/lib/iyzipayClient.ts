/* eslint-disable @typescript-eslint/no-require-imports */
const Iyzipay = require('iyzipay');

export const iyzipayClient: {
  checkoutForm: { retrieve: (req: unknown, cb: (err: Error | null, res: unknown) => void) => void };
} = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY    || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri:       process.env.IYZICO_BASE_URL   || '',
});

export const iyzipayLocale: string = Iyzipay.LOCALE?.TR ?? 'tr';
