ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Regular index for lookup performance
CREATE INDEX IF NOT EXISTS idx_siparisler_conversation_id
  ON siparisler (conversation_id)
  WHERE conversation_id IS NOT NULL;

-- Composite partial unique: prevents the same item (product+date) from being inserted
-- twice for the same payment. One conversation_id can have multiple rows (multi-item cart),
-- but not duplicate rows for the exact same product+date pair.
CREATE UNIQUE INDEX IF NOT EXISTS idx_siparisler_conversation_product_date_unique
  ON siparisler (conversation_id, "productName", "eventDate")
  WHERE conversation_id IS NOT NULL;
