# Architecture Rules

- Keep system simple and modular.

- Payment system must be isolated:
  /api/payment/create
  /api/payment/callback

- Do not mix old and new payment logic.

- Forbidden:
  - partial migration
  - hybrid payment systems

- Folder structure must remain clear:
  - app/api → backend logic
  - app/* → frontend pages
  - utils → pure helpers only

- Business logic must be in backend, not frontend.

- Each feature must:
  - have clear entry point
  - not depend on unused legacy code

- Remove dead code after migration is complete.