# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server on 0.0.0.0:3000 (cross-env)
npm run build    # Production build
npm run lint     # ESLint
```

Test suite: `npm test` (Vitest) — 3 dosya, 39 test. `__tests__/` altında `processPayment`, `conflictUtils`, `jwt-utils` coverage'ı var. TypeScript errors are suppressed at build time (`ignoreBuildErrors: true` in `next.config.ts`), so always run `npx tsc --noEmit` manually to check types.

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
| `mesajlar` | Contact form submissions; `hizmet` column stores the selected topic (`konu`); INSERT via anon client, SELECT/UPDATE/DELETE via service_role only |
| `instagram_feed` | Instagram feed posts; columns: `id`, `image_path` (filename only, no prefix), `instagram_link` (nullable), `sort_order`, `created_at` |
| `otp_store` | Admin OTP codes + verification tokens; **service_role only** — RLS enabled, no anon/authenticated policies |
| `rate_limit_store` | DB-backed rate limit counters for `OTP_REQUEST`, `OTP_VERIFY`, `LOGIN` types; **service_role only** — RLS enabled, no anon/authenticated policies |

`create_confirmed_order(...)` is a Postgres RPC function that inserts both `orders` and `orders_items` atomically. Always use it for confirmed order creation — never insert into `orders`/`orders_items` separately in application code.

Migrations live in `supabase/migrations/` and must be run in filename order.

### Payment flow (Iyzico HPP)

1. `POST /api/payment/create` — validates cart, checks conflicts in `orders_items`, creates `payment_sessions` row, calls Iyzico to get `paymentPageUrl`. Stores Iyzico token in `payment_sessions.iyzico_token`.
2. User pays on Iyzico's hosted page.
3a. Browser redirect → `POST /api/payment/callback` — thin wrapper, calls `processPayment(token)`, redirects to `/odeme-sonuc`.
3b. Iyzico server-to-server → `POST /api/payment/webhook` — verifies HMAC signature, calls `processPayment(token)`, returns 200.

Both callback and webhook use the shared `app/lib/processPayment.ts` function. Iyzipay client oluşturma `app/lib/iyzipayClient.ts` wrapper'ına alındı — `processPayment.ts` doğrudan `iyzipay` modülünü `require` etmez; bu wrapper'ı import eder (testability için).

**Critical invariants in `processPayment.ts`:**
- Claims session by `iyzico_token` with `processed=false` + `expires_at` guards — atomic, single-use.
- Prices always come from DB (`urunler.price`), never from the session cart or client.
- Iyzico 23505 unique-violation on `orders.conversation_id` → idempotent success, not error.
- Webhook always returns HTTP 200 — a non-200 causes Iyzico to retry indefinitely.

### Admin authentication

Flow: email whitelist → OTP (Gmail SMTP, 6-digit, 5 min TTL) → JWT (HS256, 15 min, `httpOnly` cookie).

- Whitelist: `ADMIN_WHITELIST_EMAILS` env var (comma-separated).
- All `/api/admin/*` routes call `verifyAdminToken()` then `enforceAdminRateLimit()` from `app/lib/admin-auth.ts`.
- OTP state → **Supabase DB** (`otp_store` tablosu, `app/lib/otp-store.ts`). Tüm işlemler service_role ile yapılır.
- Rate-limit state → **iki katmanlı**: `OTP_REQUEST`, `OTP_VERIFY`, `LOGIN` tipleri Supabase DB (`rate_limit_store`); `ADMIN_API`, `PAYMENT_*` vb. tipler in-memory (`global.__rateLimitStore`) — sunucu restart'ta sıfırlanır (`app/lib/rate-limiter.ts`).
- `global.__otpStore` artık kullanılmıyor; OTP'ler DB'de.
- JWT secret from `app/lib/secure-config.ts` → `ADMIN_JWT_SECRET` env var.

### Admin panel UI

`app/admin/page.tsx` is a single-page shell. Each tab is a self-contained module under `app/admin/{orders,products,rentals,messages}/` with a `use*.ts` hook and a `*Table.tsx` component.

`app/admin/lib/adminCache.ts` is a module-level (not React state) cache. Data is fetched once per section visit and updated in place on CRUD; cache clears only on hard refresh. When editing admin data sections, keep cache mutations in sync with API calls in the `use*.ts` hooks.

**Dashboard (`app/admin/dashboard/DashboardPage.tsx`):**
- Stat cards: Bu Ay Sipariş (event_date'e göre), Aktif Kiralama (Hazırlanıyor), Kiradakiler (Kirada), Mesajlar (bekleyen)
- Monthly revenue AreaChart (Recharts) — last 6 months, uses `orderDate` (payment date)
- Calendar: viewport-aware fixed popup on hover (`getBoundingClientRect()`), busy day highlight (3+ orders = red), no overflow-hidden on grid container
- Status normalization: `'Sipariş Tamamlandı'` → `'Tamamlandı'` via `normalizeStatus()`
- 4 statuses in STATUS_CFG: Hazırlanıyor (amber), Kirada (green), Tamamlandı (blue), İptal Edildi (red)
- Bu Ay Sipariş uses `eventDate.startsWith('YYYY-MM')` — never `new Date()` parsing (timezone-safe)

**Messages (`app/admin/messages/useMessages.ts`):**
- On reply: sends email via `/api/send-reply`, then DELETEs message from DB (does NOT mark as Verildi)
- Only `status === 'Bekliyor'` messages are shown in the list

**Instagram (`app/admin/instagram/`):**
- `InstagramPage.tsx` — grid view with hover overlay (reorder left/right, delete); "Gönderi Ekle" button opens a modal
- Modal: drag-and-drop or click to pick file (`image/*,video/*`), optional Instagram post link, Kaydet/İptal buttons
- `useInstagram.ts` — `uploadAndAdd(file, instagramLink?)` uploads to R2 via `/api/admin/storage`, saves to `instagram_feed` DB; `deletePost` calls `/api/images/delete` (field: `image`) then `/api/admin/instagram` DELETE — R2 must succeed before DB delete
- Public feed: `GET /api/instagram` returns up to 15 posts ordered by `sort_order`; homepage coverflow reads `instagram_link` for per-card Instagram redirect
- Video detection: `isVideoPath(path)` checks extension — grid renders `<video>` with hover-to-play; homepage coverflow renders `<video autoPlay muted loop>`

### Conflict detection

`/api/check-conflict`, `/api/payment/create`, and `processPayment.ts` all use `orders_items` with `BLOCKING_STATUSES = ['Hazırlanıyor', 'Kirada']` and a ±7-day date window around the event date. All three must stay consistent with each other.

### Image storage

Product images are on Cloudflare R2. Base URL: `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` / `NEXT_PUBLIC_R2_BUCKET_NAME`. Upload/delete goes through `/api/admin/storage` and `/api/images/delete`.

**Filename sanitization** — `app/api/admin/storage/route.ts` runs `sanitizeName()` on every upload before using it as an R2 key. It strips non-ASCII (emojis, Unicode), replaces spaces/`#`/`@`/dots with `_`, collapses repeated underscores, and falls back to `file_<timestamp>` if the result is empty. This handles Instagram-downloaded filenames with emojis/hashtags. Images are also converted to WebP (quality 85) via `sharp`; videos are stored as-is with their original extension.

R2 URL helper (used in ProductDetail and portfolio pages):
```ts
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};
```

`app/portfolio/[slug]/ProductDetail.tsx` supports both images and videos (`.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`) in the `product.images` array. Use `isMediaVideo(images, index)` / `getMediaUrl(images, index)` helpers already defined in that file.

The fullscreen viewer supports zoom and pan:
- Scroll wheel (desktop) and pinch gesture (mobile) to zoom (0.5×–5×)
- Click-drag to pan when zoomed in
- +/−/% buttons in top-left corner; zoom resets on image change or close
- Main product images use `object-contain` (not `object-cover`) so full photo is always visible without cropping

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
TELEGRAM_BOT_TOKEN      # optional — admin sipariş bildirimi için BotFather token'ı
TELEGRAM_ADMIN_CHAT_ID  # optional — bildirimin düşeceği Telegram chat id
```

### PWA

- `public/manifest.json` — app name, icons, theme color `#111827`, display standalone
- `public/sw.js` — network-first service worker; skips caching for `/api/` and `/admin` paths
- `app/components/ServiceWorkerRegister.tsx` — silent registration in `useEffect`; imported in `app/layout.tsx`
- `app/layout.tsx` metadata includes `manifest: "/manifest.json"` and `appleWebApp` config

---

## Frontend conventions

### Dark / light mode

Every client page manages its own `isDarkMode` state, initialized in the first `useEffect`. Priority order: saved localStorage preference → system `prefers-color-scheme` → dark as ultimate fallback. Toggle writes `'dark'` or `'light'` to localStorage explicitly.

```ts
// Pattern used in every page
useEffect(() => {
  setIsClient(true);
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    setIsDarkMode(false);
    document.documentElement.classList.remove('dark');
  } else if (savedTheme === 'dark') {
    setIsDarkMode(true);
    document.documentElement.classList.add('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}, []);
```

Always add `suppressHydrationWarning` to the root `<div>` of client pages to avoid SSR/CSR mismatch warnings.

### Navigation pattern

All pages share an identical sticky nav structure:
- Row 1: theme toggle (left) · `MERYEM BALKAN` italic serif title (center) · cart + user icons (right)
- Row 2: `ANASAYFA · ELBİSELER · HAKKIMDA · İLETİŞİM` links

The nav gains a background (`bg-gray-900` / `bg-white`) when `scrollY > 50`. Use the same `showNavBackground` guard across all pages.

**Mobile nav:** On mobile (`sm:` breakpoint), Row 2 links and the cart icon in Row 1 are hidden (`hidden sm:flex` / `hidden sm:contents`). Instead, `app/components/MobileBottomNav.tsx` renders a fixed 5-tab bottom bar (Anasayfa, Elbiseler, Sepet, Hakkımda, İletişim) with glassmorphism styling. It is excluded from `/admin` and SEO-only pages. A `h-14 sm:hidden` spacer div is appended to avoid content overlap. Registered globally in `app/layout.tsx`.

### Helper className variables (legal/content pages)

Long content pages define component-level string constants to avoid repetition:

```ts
const nc  = `w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`;
const li  = `flex items-start gap-3 text-sm leading-6 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
const dot = `mt-2 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`;
const body = `text-sm leading-7 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
const sh  = `text-xs font-semibold tracking-widest mb-4 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
const sub = `text-sm font-medium mb-3 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;
```

### Footer standard

All pages share a 3-column footer (`md:grid-cols-3`): brand + Instagram, KURUMSAL links, İLETİŞİM. Copyright line: `&copy; 2026 Meryem Balkan Tüm hakları saklıdır.`

The KURUMSAL link list (same order everywhere):
Hakkımızda · İletişime Geç · Gizlilik Politikası · KVKK · Aydınlatma Metni · Kiralama Sözleşmesi · Mesafeli Satış Sözleşmesi · Teslimat ve İade Politikası

---

## Pages

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` | Home — hero, featured products, typing animation |
| `/portfolio` | `app/portfolio/page.tsx` | Product grid with category filter |
| `/portfolio/[slug]` | `app/portfolio/[slug]/ProductDetail.tsx` | Product detail; swipe on mobile, fullscreen viewer, color/size/date selection |
| `/sepet` | `app/sepet/page.tsx` | Cart page |
| `/checkout` | `app/checkout/page.tsx` | Checkout form + Iyzico redirect |
| `/odeme-sonuc` | `app/odeme-sonuc/page.tsx` | Payment result |
| `/siparisler` | `app/siparisler/page.tsx` | Customer order history (requires OTP login) |
| `/hakkimda` | `app/hakkimda/page.tsx` | About — hero, timeline, philosophy cards |
| `/iletisim` | `app/iletisim/page.tsx` | Contact form + Google Maps embed |
| `/gizlilik-politikasi` | `app/gizlilik-politikasi/page.tsx` | Privacy policy |
| `/kvkk` | `app/kvkk/page.tsx` | KVKK (data protection) |
| `/aydinlatma-metni` | `app/aydinlatma-metni/page.tsx` | KVKK illumination text |
| `/kiralama-sozlesmesi` | `app/kiralama-sozlesmesi/page.tsx` | Rental agreement & obligations |
| `/mesafeli-satis-sozlesmesi` | `app/mesafeli-satis-sozlesmesi/page.tsx` | Distance sales contract (legal clauses) |
| `/teslimat-ve-iade-politikasi` | `app/teslimat-ve-iade-politikasi/page.tsx` | Delivery & return policy |
| `/erzincan-gelinlik-kiralama` | `app/erzincan-gelinlik-kiralama/page.tsx` | SEO landing page — no nav/footer |
| `/erzincan-abiye-kiralama` | `app/erzincan-abiye-kiralama/page.tsx` | SEO landing page — no nav/footer |
| `/erzincan-nisanlik-kiralama` | `app/erzincan-nisanlik-kiralama/page.tsx` | SEO landing page — no nav/footer |
| `/gelinlik-kiralama` | `app/gelinlik-kiralama/page.tsx` | SEO landing page — no nav/footer |
| `/abiye-kiralama` | `app/abiye-kiralama/page.tsx` | SEO landing page — no nav/footer |
| `/nisanlik-kiralama` | `app/nisanlik-kiralama/page.tsx` | SEO landing page — no nav/footer |
| `/admin` | `app/admin/page.tsx` | Admin panel (JWT-protected) |

### Contact form (`/iletisim`)

State field is `konu` (stored as `hizmet` in DB). Options: Tasarım & Kıyafet Seçimi · Randevu Talebi · Kargo & Teslimat · İade Talebi · Genel Bilgi · Diğer.

A conditional `siparisNo` field appears when `konu` is `'İade Talebi'` or `'Kargo & Teslimat'`. If filled, it is prepended to the message as `Sipariş No: ${siparisNo}\n\n` before DB insert.

After successful DB insert, if `konu === 'İade Talebi'`, a fire-and-forget POST to `/api/send-return-confirmation` sends the customer an automatic confirmation email ("2 iş günü içinde dönüş yapacağız"). Errors are silently caught — form success does not depend on this email.

---

## Mobile responsiveness rules

- All grid layouts must collapse to `grid-cols-1` on mobile (add `sm:` or `md:` prefix for multi-column).
- Never use bare `px-8` or `py-16` on section/footer wrappers — always `px-4 sm:px-8`, `py-12 sm:py-16`.
- Text sizes: use `text-2xl sm:text-3xl`, `text-base sm:text-lg` etc. — never bare large sizes without a mobile fallback.
- iframes (e.g. Google Maps): set `height="100%"` and control height via the container div's Tailwind class (`h-64 sm:h-80 lg:h-96`).
- All SEO landing pages (`/erzincan-*`, `/gelinlik-kiralama`, `/abiye-kiralama`, `/nisanlik-kiralama`) intentionally have no nav/footer — keep it that way. `MobileBottomNav` is also excluded from these pages.
