-- orders: one row per payment / conversation
CREATE TABLE IF NOT EXISTS orders (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  TEXT          UNIQUE NOT NULL,
  customer_name    TEXT          NOT NULL,
  phone            TEXT          NOT NULL,
  email            TEXT,
  address          TEXT          NOT NULL,
  order_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  payment_method   TEXT          NOT NULL DEFAULT 'Online - Iyzico HPP',
  shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_email
  ON orders (email)
  WHERE email IS NOT NULL;

-- orders_items: one row per rented item, FK to orders
CREATE TABLE IF NOT EXISTS orders_items (
  id            BIGSERIAL     PRIMARY KEY,
  order_id      UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name  TEXT          NOT NULL,
  color         TEXT          NOT NULL,
  size          TEXT          NOT NULL,
  event_date    DATE          NOT NULL,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  status        TEXT          NOT NULL DEFAULT 'Hazırlanıyor',
  shipping_code TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_items_order_id
  ON orders_items (order_id);

-- Conflict checks filter by product + date range + status
CREATE INDEX IF NOT EXISTS idx_orders_items_product_event_status
  ON orders_items (product_name, event_date, status);

-- RLS: service role bypasses RLS; all other access denied (same pattern as payment_sessions)
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_items ENABLE ROW LEVEL SECURITY;

-- Atomically insert one orders row + N orders_items rows in a single transaction.
-- The UNIQUE constraint on orders.conversation_id is the final race guard:
-- if two callbacks race, the second gets a 23505 unique-violation which the
-- caller treats as an idempotent success.
CREATE OR REPLACE FUNCTION create_confirmed_order(
  p_conversation_id TEXT,
  p_customer_name   TEXT,
  p_phone           TEXT,
  p_email           TEXT,
  p_address         TEXT,
  p_payment_method  TEXT,
  p_shipping_cost   NUMERIC,
  p_total_price     NUMERIC,
  p_items           JSONB        -- [{product_name, color, size, event_date, price}, ...]
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  INSERT INTO orders (
    conversation_id,
    customer_name,
    phone,
    email,
    address,
    payment_method,
    shipping_cost,
    total_price
  ) VALUES (
    p_conversation_id,
    p_customer_name,
    p_phone,
    p_email,
    p_address,
    p_payment_method,
    p_shipping_cost,
    p_total_price
  )
  RETURNING id INTO v_order_id;

  INSERT INTO orders_items (
    order_id,
    product_name,
    color,
    size,
    event_date,
    price
  )
  SELECT
    v_order_id,
    item->>'product_name',
    item->>'color',
    item->>'size',
    (item->>'event_date')::DATE,
    (item->>'price')::NUMERIC
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_order_id;
END;
$$;
