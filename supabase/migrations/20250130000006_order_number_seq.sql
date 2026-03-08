-- Sequence for human-readable order numbers (FR-YEAR-SEQ)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
  SELECT 'FR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
$$ LANGUAGE sql;
