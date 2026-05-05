-- Migrate existing siparisler rows → orders + orders_items.
-- Run AFTER create_orders_tables.sql.
-- "Ödeme Yapıyor" rows (abandoned pending sessions) are intentionally skipped;
-- they were never confirmed payments.
--
-- Price stored as "5000 TL" text → REGEXP strips non-digits → NUMERIC.
-- Rows with same conversation_id share one orders parent (ON CONFLICT DO NOTHING).
-- Rows without conversation_id get a synthetic "legacy-<id>" key.

BEGIN;

-- Step 1: one orders row per unique conversation key
INSERT INTO orders (
  conversation_id,
  customer_name,
  phone,
  email,
  address,
  order_date,
  payment_method,
  shipping_cost,
  total_price
)
SELECT DISTINCT ON (conv_key)
  conv_key,
  COALESCE("customerName", ''),
  COALESCE(phone, ''),
  NULLIF(email, ''),
  COALESCE(address, ''),
  COALESCE("orderDate", CURRENT_DATE),
  COALESCE("paymentMethod", 'Bilinmiyor'),
  0,
  0
FROM (
  SELECT *, COALESCE(conversation_id, 'legacy-' || id::text) AS conv_key
  FROM siparisler
  WHERE status NOT IN ('Ödeme Yapıyor')
) src
ORDER BY conv_key, id
ON CONFLICT (conversation_id) DO NOTHING;

-- Step 2: one orders_items row per siparisler row
INSERT INTO orders_items (
  order_id,
  product_name,
  color,
  size,
  event_date,
  price,
  status,
  shipping_code
)
SELECT
  o.id,
  COALESCE(s."productName", ''),
  COALESCE(s.color, ''),
  COALESCE(s.size, ''),
  COALESCE(s."eventDate", CURRENT_DATE),
  COALESCE(
    NULLIF(REGEXP_REPLACE(s.price, '[^0-9]', '', 'g'), '')::NUMERIC,
    0
  ),
  s.status,
  s."shippingCode"
FROM siparisler s
JOIN orders o
  ON o.conversation_id = COALESCE(s.conversation_id, 'legacy-' || s.id::text)
WHERE s.status NOT IN ('Ödeme Yapıyor');

COMMIT;
