-- 3.1 create_missing_tables.sql
-- This migration introduces required enums and tables for orders, clients,
-- quality control, shopping lists, suppliers, purchase orders and expenses.
-- It also aligns core production/recipe/ingredient tables with the target model.

------------------------------
-- ENUMS
------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'ready', 'delivered', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
    CREATE TYPE client_type AS ENUM ('individual', 'business');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
    CREATE TYPE payment_method_type AS ENUM ('cash', 'card', 'transfer', 'credit');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shopping_list_status') THEN
    CREATE TYPE shopping_list_status AS ENUM ('pending', 'purchased', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
    CREATE TYPE purchase_order_status AS ENUM ('draft', 'sent', 'received', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_type') THEN
    CREATE TYPE expense_type AS ENUM ('ingredient', 'labor', 'overhead', 'marketing', 'other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'production_status') THEN
    CREATE TYPE production_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
  END IF;
END $$;

------------------------------
-- CORE MASTER DATA
------------------------------

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  rfc text,
  payment_terms integer,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suppliers' AND policyname = 'Allow authenticated read suppliers'
  ) THEN
    CREATE POLICY "Allow authenticated read suppliers"
      ON public.suppliers
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suppliers' AND policyname = 'Allow service role all suppliers'
  ) THEN
    CREATE POLICY "Allow service role all suppliers"
      ON public.suppliers
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

------------------------------
-- CLIENTS
------------------------------

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  rfc text,
  business_name text,
  client_type client_type NOT NULL DEFAULT 'individual',
  credit_limit numeric,
  payment_terms integer,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients' AND policyname = 'Users can view clients'
  ) THEN
    CREATE POLICY "Users can view clients"
      ON public.clients
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients' AND policyname = 'Service role all clients'
  ) THEN
    CREATE POLICY "Service role all clients"
      ON public.clients
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

------------------------------
-- ORDERS & ORDER ITEMS
------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  order_date timestamptz DEFAULT now(),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal numeric(10,2),
  tax numeric(10,2),
  total numeric(10,2),
  payment_method payment_method_type,
  cfdi_use text,
  rfc text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Users can view orders'
  ) THEN
    CREATE POLICY "Users can view orders"
      ON public.orders
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Service role all orders'
  ) THEN
    CREATE POLICY "Service role all orders"
      ON public.orders
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'order_items' AND policyname = 'Users can view order_items'
  ) THEN
    CREATE POLICY "Users can view order_items"
      ON public.order_items
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'order_items' AND policyname = 'Service role all order_items'
  ) THEN
    CREATE POLICY "Service role all order_items"
      ON public.order_items
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

------------------------------
-- BATCH QUALITY CONTROL
------------------------------

CREATE TABLE IF NOT EXISTS public.batch_quality_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  units_produced integer NOT NULL,
  units_accepted integer NOT NULL,
  units_rejected integer NOT NULL,
  rejection_reason text,
  inspector_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.batch_quality_control ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'batch_quality_control' AND policyname = 'Users can view batch_quality_control'
  ) THEN
    CREATE POLICY "Users can view batch_quality_control"
      ON public.batch_quality_control
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'batch_quality_control' AND policyname = 'Service role all batch_quality_control'
  ) THEN
    CREATE POLICY "Service role all batch_quality_control"
      ON public.batch_quality_control
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

------------------------------
-- SHOPPING LIST
------------------------------

CREATE TABLE IF NOT EXISTS public.shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id),
  quantity_needed numeric(12,3) NOT NULL,
  unit text NOT NULL,
  estimated_cost numeric(12,2),
  actual_cost numeric(12,2),
  status shopping_list_status NOT NULL DEFAULT 'pending',
  supplier text,
  purchase_order_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shopping_list' AND policyname = 'Users can view shopping_list'
  ) THEN
    CREATE POLICY "Users can view shopping_list"
      ON public.shopping_list
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shopping_list' AND policyname = 'Service role all shopping_list'
  ) THEN
    CREATE POLICY "Service role all shopping_list"
      ON public.shopping_list
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shopping_list_ingredient_id ON public.shopping_list(ingredient_id);

------------------------------
-- PURCHASE ORDERS
------------------------------

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id),
  order_date timestamptz DEFAULT now(),
  expected_delivery timestamptz,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  subtotal numeric(12,2),
  tax numeric(12,2),
  total numeric(12,2),
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'purchase_orders' AND policyname = 'Users can view purchase_orders'
  ) THEN
    CREATE POLICY "Users can view purchase_orders"
      ON public.purchase_orders
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'purchase_orders' AND policyname = 'Service role all purchase_orders'
  ) THEN
    CREATE POLICY "Service role all purchase_orders"
      ON public.purchase_orders
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

------------------------------
-- EXPENSES
------------------------------

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type expense_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.expense_categories(id),
  amount numeric(12,2) NOT NULL,
  description text,
  expense_date timestamptz NOT NULL DEFAULT now(),
  payment_method payment_method_type,
  receipt_url text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expense_categories' AND policyname = 'Users can view expense_categories'
  ) THEN
    CREATE POLICY "Users can view expense_categories"
      ON public.expense_categories
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expense_categories' AND policyname = 'Service role all expense_categories'
  ) THEN
    CREATE POLICY "Service role all expense_categories"
      ON public.expense_categories
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expenses' AND policyname = 'Users can view expenses'
  ) THEN
    CREATE POLICY "Users can view expenses"
      ON public.expenses
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expenses' AND policyname = 'Service role all expenses'
  ) THEN
    CREATE POLICY "Service role all expenses"
      ON public.expenses
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

------------------------------
-- CORE TABLE ADJUSTMENTS
------------------------------

-- production_batches: add richer production fields and remove legacy batch_count usage
ALTER TABLE public.production_batches
  ADD COLUMN IF NOT EXISTS quantity_produced integer,
  ADD COLUMN IF NOT EXISTS units_accepted integer,
  ADD COLUMN IF NOT EXISTS units_rejected integer,
  ADD COLUMN IF NOT EXISTS quality_notes text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.production_batches
  DROP COLUMN IF EXISTS batch_count;

-- recipes: move toward UUID ids and richer costing fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.recipes
      ALTER COLUMN id TYPE uuid USING id::uuid;
  END IF;
END $$;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS batch_size integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS labor_cost numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_cost numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric(10,2);

-- ingredients: ensure fields for pricing, stock and supplier linkage
ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS current_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS min_stock numeric(12,3),
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id);

