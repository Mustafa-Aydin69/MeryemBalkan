# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server on 0.0.0.0:3000 (cross-env)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite exists. TypeScript errors are suppressed at build time (`ignoreBuildErrors: true` in `next.config.ts`), so always run `npx tsc --noEmit` manually to check types.

## Architecture

### Stack
Next.js 16 App Router · TypeScript · Supabase (PostgreSQL) · Tailwind CSS · Iyzico (payment) · Nodemailer (Gmail SMTP) · Cloudflare R2 (images)

### Database schema

Two Supabase clients — never mix them:
- `app/utils/supabaseClient.ts` — anon key, **client-side only**
- `app/lib/supabaseAdmin.ts` — service role key, **server-side (API routes) only**, bypasses RLS

Core tables:

| Table | Purpose |
|-------|---------|
| `orders` | One row per payment; `conversation_id UNIQUE` |
| `orders_items` | One row per rented item; FK → `orders.id`; carries `status` and `shipping_code` |
| `payment_sessions` | Iyzico HPP session state; `conversation_id UNIQUE`; `processed` flag is the atomic idempotency guard |
| `urunler` | Product catalog |

`create_confirmed_order(...)` is a Postgres RPC function that inserts both `orders` and `orders_items` atomically. Always use it for confirmed order creation — never insert into `orders`/`orders_items` separately in application code.

Migrations live in `supabase/migrations/` and must be run in filename order.

### Payment flow (Iyzico HPP)

1. `POST /api/payment/create` — validates cart, checks conflicts in `orders_items`, creates `payment_sessions` row, calls Iyzico to get `paymentPageUrl`. Stores Iyzico token in `payment_sessions.iyzico_token`.
2. User pays on Iyzico's hosted page.
3a. Browser redirect → `POST /api/payment/callback` — thin wrapper, calls `processPayment(token)`, redirects to `/odeme-sonuc`.
3b. Iyzico server-to-server → `POST /api/payment/webhook` — verifies HMAC signature, calls `processPayment(token)`, returns 200.

Both callback and webhook use the shared `app/lib/processPayment.ts` function.

**Critical invariants in `processPayment.ts`:**
- Claims session by `iyzico_token` with `processed=false` + `expires_at` guards — atomic, single-use.
- Prices always come from DB (`urunler.price`), never from the session cart or client.
- Iyzico 23505 unique-violation on `orders.conversation_id` → idempotent success, not error.
- Webhook always returns HTTP 200 — a non-200 causes Iyzico to retry indefinitely.

### Admin authentication

Flow: email whitelist → OTP (Gmail SMTP, 6-digit, 5 min TTL) → JWT (HS256, 15 min, `httpOnly` cookie).

- Whitelist: `ADMIN_WHITELIST_EMAILS` env var (comma-separated).
- All `/api/admin/*` routes call `verifyAdminToken()` then `enforceAdminRateLimit()` from `app/lib/admin-auth.ts`.
- OTP state and rate-limit state are **in-memory** (`global.__otpStore`, `global.__rateLimitStore`). They reset on server restart; a Redis replacement is noted as a TODO.
- JWT secret from `app/lib/secure-config.ts` → `ADMIN_JWT_SECRET` env var.

### Admin panel UI

`app/admin/page.tsx` is a single-page shell. Each tab is a self-contained module under `app/admin/{orders,products,rentals,messages}/` with a `use*.ts` hook and a `*Table.tsx` component.

`app/admin/lib/adminCache.ts` is a module-level (not React state) cache. Data is fetched once per section visit and updated in place on CRUD; cache clears only on hard refresh. When editing admin data sections, keep cache mutations in sync with API calls in the `use*.ts` hooks.

### Conflict detection

`/api/check-conflict`, `/api/payment/create`, and `processPayment.ts` all use `orders_items` with `BLOCKING_STATUSES = ['Hazırlanıyor', 'Kirada']` and a ±7-day date window around the event date. All three must stay consistent with each other.

### Image storage

Product images are on Cloudflare R2. Base URL: `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` / `NEXT_PUBLIC_R2_BUCKET_NAME`. Upload/delete goes through `/api/admin/storage` and `/api/images/delete`.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
IYZICO_API_KEY
IYZICO_SECRET_KEY
IYZICO_BASE_URL
NEXT_PUBLIC_SITE_URL
EMAIL_USER
EMAIL_PASSWORD
ADMIN_WHITELIST_EMAILS
ADMIN_JWT_SECRET
NEXT_PUBLIC_R2_PUBLIC_BASE_URL
NEXT_PUBLIC_R2_BUCKET_NAME
IYZICO_WEBHOOK_SECRET   # optional — HMAC-SHA256 secret for webhook signature verification
```
