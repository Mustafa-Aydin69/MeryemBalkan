CREATE TABLE IF NOT EXISTS payment_sessions (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  TEXT          UNIQUE NOT NULL,
  cart_items       JSONB         NOT NULL,
  customer         JSONB         NOT NULL,
  shipping_address JSONB         NOT NULL,
  delivery_method  TEXT          NOT NULL CHECK (delivery_method IN ('pickup', 'shipping')),
  shipping_cost    NUMERIC(10,2) NOT NULL,
  total_price      NUMERIC(10,2) NOT NULL,
  processed        BOOLEAN       NOT NULL DEFAULT FALSE,
  iyzico_token     TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_conversation_id
  ON payment_sessions (conversation_id);

-- Partial unique index: each token is single-use; NULL (unprocessed) rows are unrestricted
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_sessions_iyzico_token_unique
  ON payment_sessions (iyzico_token)
  WHERE iyzico_token IS NOT NULL;

-- RLS enabled with no policies = all non-service-role access denied
-- getSupabaseAdmin() uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
