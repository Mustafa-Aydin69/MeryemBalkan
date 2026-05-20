/* eslint-disable @typescript-eslint/no-require-imports */
type IyzipayClientType = {
  checkoutForm: { retrieve: (req: unknown, cb: (err: Error | null, res: unknown) => void) => void };
};

let _client: IyzipayClientType | null = null;
let _locale: string | null = null;

export function getIyzipayClient(): IyzipayClientType {
  if (!_client) {
    const Iyzipay = require('iyzipay');
    _client = new Iyzipay({
      apiKey:    process.env.IYZICO_API_KEY    || '',
      secretKey: process.env.IYZICO_SECRET_KEY || '',
      uri:       process.env.IYZICO_BASE_URL   || '',
    });
    _locale = Iyzipay.LOCALE?.TR ?? 'tr';
  }
  return _client!;
}

export function getIyzipayLocale(): string {
  if (!_locale) getIyzipayClient();
  return _locale!;
}
