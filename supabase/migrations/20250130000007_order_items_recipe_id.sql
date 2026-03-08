-- Add recipe_id to order_items for inventory decrement (resolve product -> recipe -> ingredients)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS recipe_id uuid;

CREATE INDEX IF NOT EXISTS idx_order_items_recipe_id ON order_items(recipe_id);
