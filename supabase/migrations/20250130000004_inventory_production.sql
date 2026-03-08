-- Phase 1: inventory_transactions and production_batches

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity decimal(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('order','production','restock','adjustment')),
  reference_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_ingredient ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role all inventory_transactions" ON inventory_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow public read inventory_transactions" ON inventory_transactions FOR SELECT USING (true);

-- production_batches (recipe_id may reference recipes table if it exists)
CREATE TABLE IF NOT EXISTS production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id text NOT NULL,
  recipe_name text,
  batch_count int NOT NULL,
  produced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_batches_recipe ON production_batches(recipe_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_produced ON production_batches(produced_at DESC);

ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role all production_batches" ON production_batches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow public read production_batches" ON production_batches FOR SELECT USING (true);
