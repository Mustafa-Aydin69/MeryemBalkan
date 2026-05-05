CREATE TABLE IF NOT EXISTS payment_events (
  id              BIGSERIAL       PRIMARY KEY,
  event_type      TEXT            NOT NULL,  -- 'callback' | 'webhook'
  token           TEXT,
  conversation_id TEXT,
  result          TEXT,           -- 'success' | 'already_processed' | 'failed' | 'error'
  error_msg       TEXT,
  ip              TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_conversation_id
  ON payment_events (conversation_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_created_at
  ON payment_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_result
  ON payment_events (result)
  WHERE result IN ('error', 'mismatch');

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
