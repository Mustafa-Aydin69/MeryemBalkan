# Payment Rules (Iyzico HPP Only)

- Only use Iyzico Hosted Payment Page (HPP).
- Never implement custom card forms.
- Never use 3DS init, 3DS callback, or BIN check endpoints.

- Payment flow must be:
  checkout → /api/payment/create → redirect to Iyzico → /api/payment/callback

- Orders must NOT be created before payment confirmation.

- In callback:
  - Always verify payment with Iyzico API using token.
  - Never trust request body directly.

- Only create order if:
  paymentStatus === "SUCCESS"

- Always validate:
  - price
  - currency
  - conversationId

- Each payment must have unique conversationId.

- Callback must be idempotent (same request must not create duplicate orders).