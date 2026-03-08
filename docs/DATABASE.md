# Funny Rolls — Database Schema (Supabase/PostgreSQL)

Run migrations in `supabase/migrations/` in order (by filename).

## Tables

### ingredients (existing + new columns)

- `id` (uuid, PK)
- `name`, `unit`, etc.
- **current_stock** decimal(10,2) DEFAULT 0
- **price_per_unit** decimal(10,2)
- **reorder_level** decimal(10,2) DEFAULT 0
- **category** text

RLS: SELECT for all; full access for service_role.

### orders

- `id` uuid PK
- `order_number` text UNIQUE NOT NULL
- `status` text CHECK (pending, paid, preparing, ready, completed, cancelled)
- `subtotal`, `tax`, `total` decimal(12,2)
- `notes`, `customer_name`, `customer_phone`, `customer_email` text
- `created_at`, `updated_at` timestamptz

### order_items

- `id` uuid PK
- `order_id` uuid FK → orders(id) ON DELETE CASCADE
- `product_id` int, `product_name` text
- `quantity` int, `unit_price`, `line_total` decimal(12,2)
- `recipe_id` uuid (nullable, for inventory decrement)
- `created_at` timestamptz

### payments

- `id` uuid PK
- `order_id` uuid FK → orders(id)
- `method` text CHECK (cash, card, mock)
- `amount` decimal(12,2)
- `status` text CHECK (initiated, authorized, paid, failed, refunded)
- `amount_received`, `change_due` decimal(12,2)
- `gateway_reference` text (e.g. Stripe pi_xxx)
- `idempotency_key` text UNIQUE
- `created_at` timestamptz

### inventory_transactions

- `id` uuid PK
- `ingredient_id` uuid FK → ingredients(id)
- `quantity` decimal(12,2) — negative = usage
- `type` text CHECK (order, production, restock, adjustment)
- `reference_id` uuid, `notes` text
- `created_at` timestamptz

### production_batches

- `id` uuid PK
- `recipe_id` text, `recipe_name` text
- `batch_count` int
- `produced_at`, `created_at` timestamptz

### profiles (optional, for future auth)

- `id` uuid PK
- `email`, `full_name` text
- `role` text (admin, manager, staff, viewer)

## Functions

- `generate_order_number()` — returns text like `FR-2025-00001` using sequence `order_number_seq`.

## Indexes

See migration files for indexes on status, created_at, order_number, order_id, ingredient_id, etc.
