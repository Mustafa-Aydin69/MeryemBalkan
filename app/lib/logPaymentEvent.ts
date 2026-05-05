import { getSupabaseAdmin } from './supabaseAdmin';

export interface PaymentEventPayload {
  event_type: 'callback' | 'webhook';
  token?: string;
  conversation_id?: string;
  result: string;
  error_msg?: string;
  ip?: string;
}

export async function logPaymentEvent(payload: PaymentEventPayload): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('payment_events').insert({
      event_type:      payload.event_type,
      token:           payload.token ? payload.token.slice(0, 40) : null,
      conversation_id: payload.conversation_id ?? null,
      result:          payload.result,
      error_msg:       payload.error_msg ?? null,
      ip:              payload.ip ?? null,
    });
  } catch (err) {
    // Logging never crashes the main flow
    console.error('[logPaymentEvent] DB yazma hatası:', err);
  }
}
