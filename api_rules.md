# API Rules

- All sensitive operations must be server-side only.
- Never trust data from frontend.

- APIs must:
  - validate input
  - sanitize input
  - handle errors safely

- Do not expose:
  - secret keys
  - internal logic
  - database structure

- Payment APIs:
  - /api/payment/create
  - /api/payment/callback
  Only these are allowed.

- Forbidden APIs:
  - /api/payment/3ds-init
  - /api/payment/3ds-callback
  - /api/payment/bin-check

- Remove unused APIs after migration.

- Each API must have a single responsibility.