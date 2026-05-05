# Security Rules

- Never trust frontend data (price, cart, user input).

- Always recompute:
  - price
  - order data
  on backend.

- Validate payment using Iyzico API before creating order.

- Reject request if:
  - payment not verified
  - price mismatch
  - invalid token

- Use unique conversationId per payment.

- Prevent replay attacks:
  - do not reuse tokens
  - mark processed payments

- Rate limit sensitive endpoints:
  - login
  - payment callback

- Do not log sensitive data:
  - card info
  - tokens
  - personal data