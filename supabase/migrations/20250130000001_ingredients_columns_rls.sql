-- Phase 1: Ingredients table - add POS/inventory columns and RLS
-- Run in Supabase SQL Editor or via supabase db push

-- Add columns if not exist (safe for existing DB)
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS current_stock DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS reorder_level DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Backfill price_per_unit from existing price if column was just added
UPDATE ingredients SET price_per_unit = price WHERE price_per_unit IS NULL AND price IS NOT NULL;

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Policies: allow read for anon (menu/calculator), full for service_role
DROP POLICY IF EXISTS "Allow public read ingredients" ON ingredients;
CREATE POLICY "Allow public read ingredients" ON ingredients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role all on ingredients" ON ingredients;
CREATE POLICY "Allow service role all on ingredients" ON ingredients
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: authenticated users (e.g. staff) can update
-- CREATE POLICY "Allow authenticated update ingredients" ON ingredients
--   FOR UPDATE USING (auth.role() = 'authenticated');
