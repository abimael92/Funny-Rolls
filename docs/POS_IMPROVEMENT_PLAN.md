# Funny Rolls — Full POS Improvement Plan

**Purpose:** Transform the bakery app from marketing site + calculator + mock POS into a production-ready POS with real inventory, order processing, and payments.

**Document version:** 1.0  
**Audience:** Full-stack developers, product owners

---

## Table of Contents

1. [Complete Data Flow Analysis](#1-complete-data-flow-analysis)
2. [Inventory Management System](#2-inventory-management-system)
3. [Order Processing Flow](#3-order-processing-flow)
4. [Payment Integration](#4-payment-integration)
5. [Complete User Real Data Flow](#5-complete-user-real-data-flow)
6. [Missing Features for Full POS](#6-missing-features-for-full-pos)
7. [Database Schema Improvements](#7-database-schema-improvements)
8. [API Routes Needed](#8-api-routes-needed)
9. [Frontend Components to Build](#9-frontend-components-to-build)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Complete Data Flow Analysis

### 1.1 How Data Currently Flows

| Layer | Source | Consumer | Notes |
|-------|--------|---------|--------|
| **Products / menu** | `lib/data.ts` (mock) + Supabase `recipes` (page fetch) | Home page, MenuSection, CartModal | Combined in `allProducts`; DB recipes transformed to product-like shape. |
| **Cart** | React state (`app/page.tsx`) | CartModal, Navbar | Never persisted; lost on refresh. |
| **Orders** | `lib/order-store.ts` (localStorage) | `lib/services/orders.ts` → CartModal flow | Created on "Pagar" → "Completar venta". Not in Supabase. |
| **Payments** | `lib/payment-store.ts` (localStorage) | `lib/services/payments.ts` → CartModal | Initiated on "Pagar", updated to "paid" on complete. Not in Supabase. |
| **Ingredients** | `lib/data.ts` (mock) + Supabase `ingredients` | RecipeCalculator, IngredientsPanel | Merged by name; DB uses UUID `id`, mock uses string numbers `'1'`,`'2'`. |
| **Recipes** | `lib/data.ts` (mock) + Supabase `recipes` | RecipeCalculator, RecipeCalculatorPanel | DB recipes use `ingredients` (JSONB); `ingredientId` in mock is numeric string. |
| **Inventory** | React state + localStorage (`recipe-calculator-inventory`) | RecipeCalculator, IngredientsPanel, ProductionTrackerPanel | Calculator-only; not shared with POS. Decremented only when recording production in calculator. |
| **Tools** | `lib/data.ts` (mock) + Supabase `tools` | RecipeCalculator, ToolsPanel | Similar merge pattern as ingredients. |

**Service layer:** UI reads via `lib/services/*` (products, ingredients, tools, orders, payments, cart totals, daily summary). Orders and payments are written only through services; stores are not imported by components.

### 1.2 What’s Broken or Missing

| Issue | Severity | Description |
|-------|----------|-------------|
| **Orders only in localStorage** | P0 | Orders and payments are not in Supabase; no backup, no multi-device, no server-side history. |
| **"Pagar" not tied to backend** | P0 | In code, "Pagar" creates Order + Payment in localStorage and completes flow (mock). For production, orders must be created and updated in DB. |
| **No inventory check at checkout** | P0 | Checkout does not verify stock; inventory is calculator-only and never decremented by POS orders. |
| **Ingredient ID mismatch** | P1 | Mock recipes use `ingredientId: '1','2'`; Supabase ingredients use UUID. Recipes from DB may reference UUIDs; mock data and merge logic can break. |
| **Ingredients table incomplete** | P1 | Missing `current_stock`, `price_per_unit` (or equivalent) for real inventory and pricing in DB. |
| **RLS not enabled on ingredients** | P1 | Row Level Security missing on `ingredients`; any client with anon key can read/write all rows. |
| **Cart not persisted** | P2 | Cart is in-memory only; refresh loses it. |
| **Calculator inventory ≠ POS inventory** | P0 | Two separate notions of inventory (calculator state vs future DB); must unify. |
| **No order number for customers** | P1 | Order id is internal (e.g. `order-xyz`); no human-readable order number for receipts or lookup. |
| **Production batches not in DB** | P2 | Production tracking is mock/local; not linked to `production_batches` or inventory in DB. |

### 1.3 How Data Should Flow in a Production POS

```
Customer → Menu (products from DB)
         → Add to cart (session or state)
         → Checkout → API: check inventory
                   → API: create order (pending) + reserve stock or fail
                   → Payment (Stripe/cash) → API: confirm payment, update order
                   → API: decrement inventory (or release reserve)
                   → Receipt / notification

Kitchen  → Orders list (from DB, status: paid → preparing → ready)
         → Production batches recorded → API: update inventory (usage)

Back office → Ingredients from DB (with current_stock, price)
            → Recipes from DB (ingredient_id = UUID)
            → Reports from orders + inventory + payments
```

**Principles:**

- Single source of truth: orders, order_items, payments, inventory in Supabase (or backend).
- Idempotent checkout and payment (idempotency keys / unique constraints).
- Inventory: reserve on order creation or decrement on payment; production batches add or adjust stock.

---

## 2. Inventory Management System

### 2.1 Track Ingredient Stock in Real Time

- **Storage:** Add `current_stock` (numeric) and `unit` (or use existing `unit`) on `ingredients` (or a dedicated `inventory` table keyed by ingredient id).
- **Updates:** Change stock only via API or Supabase RPC so RLS and triggers can enforce rules and audit.
- **UI:** Dashboard and calculator read current stock from API/DB; low-stock alerts from same source.

**Complexity:** M

### 2.2 Auto-Decrement on Order Completion

- On order status transition to `paid` (or `completed`):
  - For each order line, resolve product → recipe → recipe ingredients and quantities.
  - For each ingredient, decrement `current_stock` by (quantity × recipe amount per unit).
  - Use a transaction or RPC so order update + inventory updates are atomic.
- Option: reserve stock at order creation and convert reserve to decrement on payment (reduces oversell).

**Complexity:** L

### 2.3 Low Stock Alerts and Reordering

- **Definition:** `current_stock <= threshold` (e.g. `min_amount` or a new `reorder_point` column).
- **Alerts:** Dashboard widget or notification when any ingredient is below threshold; optional email/daily digest.
- **Reordering:** P2 feature: reorder list, suggested quantities, or link to supplier; no implementation detail here.

**Complexity:** S (alerts), M (reorder workflow)

### 2.4 Link Production Batches to Inventory

- **Production batch:** Record “we made X batches of recipe Y at time Z.”
- **Effect on inventory:** Decrease stock by recipe’s ingredient usage for those batches (same math as order completion but for production).
- **Optional:** “Restock” events that increase stock (e.g. purchase orders) with a separate flow.

**Complexity:** M

### 2.5 Track Ingredient Usage per Recipe

- Already modeled: `Recipe.ingredients[]` with `ingredientId` and `amount`.
- Ensure recipe ingredients reference DB ingredient IDs (UUID) and units align with inventory units so decrement math is correct.
- Option: store usage history in `inventory_transactions` (see schema below).

---

## 3. Order Processing Flow

### 3.1 Convert Cart to Order with Unique Order Number

- **Order number:** Human-readable, unique (e.g. `FR-2025-00001`). Generate in backend (sequence or date + sequence).
- **Flow:** POST `/api/orders/create` with cart items, customer info, notes → create `orders` row + `order_items` rows, return `order_id` and `order_number`.

**Complexity:** M

### 3.2 Check Inventory Before Order Creation

- Before inserting order:
  - For each cart line, get product’s recipe and required ingredient quantities (scaled by quantity).
  - Sum required per ingredient across all lines.
  - Compare with `current_stock` (and reserved stock if applicable).
  - If any ingredient is insufficient, return 400 with which items are short; do not create order.

**Complexity:** M

### 3.3 Reserve Items While Processing Payment

- **Option A (simpler):** Create order with status `pending`; on payment success set `paid` and then decrement inventory. Risk: short window of oversell if two pay at once.
- **Option B (robust):** On order creation, create “reservation” (e.g. `inventory_reservations` or negative `inventory_transactions`) so available = current_stock - reserved. On payment, convert reservation to decrement; on timeout/cancel, release reservation.

**Complexity:** Option A S, Option B L

### 3.4 Order Statuses

- **pending** — Created, not paid.
- **paid** — Payment received; inventory can be decremented; kitchen can start.
- **preparing** — Kitchen is preparing.
- **ready** — Ready for pickup/delivery.
- **completed** — Fulfilled.
- **cancelled** — Cancelled; release reservation if any.

Store in `orders.status`; allow transitions via `/api/orders/[id]/status` with validation (e.g. paid → preparing → ready → completed).

**Complexity:** S

### 3.5 Store Order History Permanently

- All orders and order_items in Supabase; no dependency on localStorage for history.
- Payments in DB linked to orders (see schema).
- Optional: soft delete or `cancelled` only; keep rows for reporting.

**Complexity:** S (once schema and API exist)

---

## 4. Payment Integration

### 4.1 Cash Payment

- Already in app: amount received, change, completion (mock).
- Production: persist in DB (payment row with method `cash`, amount, status `paid`); optionally store `amount_received` and `change_due` for reconciliation.

**Complexity:** S

### 4.2 Card Payment (e.g. Stripe)

- **Checkout:** Create Stripe PaymentIntent (or Checkout Session) with `order_id` / idempotency.
- **Webhook:** On `payment_intent.succeeded`, update order to `paid` and payment row; then decrement inventory (or convert reserve).
- **UI:** Redirect to Stripe or embedded form; return URL to order confirmation.

**Complexity:** L

### 4.3 Reconciliation

- Payments table with method, amount, status, gateway reference, order_id.
- Daily report: sum by method, compare to Stripe dashboard and cash drawer.

**Complexity:** M

### 4.4 Receipt Generation

- **Data:** Order + items + payment from DB.
- **Output:** PDF or HTML; send via email/SMS or print (browser print or dedicated printer API).
- **Trigger:** After order status = paid or completed.

**Complexity:** M

---

## 5. Complete User Real Data Flow (Lifecycle)

End-to-end flow with real data:

1. **Customer browses menu**  
   Products from DB (and/or Supabase `recipes`). Add to cart (state or session).

2. **Checkout**  
   - Client calls `POST /api/inventory/check` with cart (product ids + quantities).  
   - If insufficient stock → show message, block checkout.  
   - Client calls `POST /api/orders/create` with cart, notes, customer info → order created (status `pending`), optional reserve.  
   - Redirect or show payment UI (cash or Stripe).

3. **Payment**  
   - **Cash:** Client sends amount received; `POST /api/payments/process` (or order complete) with method `cash` → order `paid`, payment row created.  
   - **Card:** Stripe flow; webhook marks order `paid` and creates payment row.

4. **Inventory**  
   - On order `paid`, backend decrements ingredient stock (or converts reserve to decrement).  
   - Optionally emit event for “order paid” for analytics or notifications.

5. **Kitchen**  
   - Kitchen view reads orders with status `paid` or `preparing`.  
   - Updates status to `preparing` → `ready` via `PATCH /api/orders/[id]/status`.

6. **Completion**  
   - Order marked `completed`.  
   - Receipt generated and sent (email/SMS) or printed.  
   - Customer notified (optional).

7. **Reports**  
   - Daily sales: aggregate orders by day, status, payment method.  
   - Inventory: current stock, low stock, usage from `inventory_transactions`.  
   - Profit: revenue from orders, cost from recipe × ingredient cost.

---

## 6. Missing Features for Full POS

Priorities: **P0** = must-have for MVP POS, **P1** = important, **P2** = nice-to-have.

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|--------|
| Orders & order_items in DB | P0 | M | Replace localStorage order-store with API + Supabase. |
| Payments in DB + cash flow | P0 | S | Persist payments; link to order; complete cash in UI. |
| Inventory in DB + decrement on order | P0 | L | current_stock, decrement on paid; reserve optional. |
| Inventory check before order create | P0 | M | Block checkout if insufficient stock. |
| Human-readable order number | P0 | S | e.g. FR-YYYY-NNNNN. |
| Ingredient ID alignment (UUID everywhere) | P1 | M | Recipes and calculator use UUID for ingredientId. |
| RLS on all POS tables | P1 | M | ingredients, orders, order_items, payments, inventory. |
| Stripe (or other) card payments | P1 | L | PaymentIntent + webhook; idempotency. |
| Receipt (print/email/SMS) | P1 | M | After paid or completed. |
| Order history view (UI) | P1 | S | List orders from API. |
| Low stock alerts | P1 | S | Dashboard or banner when stock &lt; threshold. |
| Tax configuration | P1 | S | Tax rate per item or global; store in DB. |
| Refund handling | P1 | M | Refund in Stripe; update order/payment; optional inventory restore. |
| Employee management and shifts | P2 | L | profiles, roles, shifts; audit who did what. |
| Customer database and history | P2 | L | customers table; link orders to customer. |
| Reports and analytics | P2 | M | Daily/weekly sales, inventory reports, profit. |
| Kitchen display system | P2 | M | Real-time orders; status updates. |
| Offline mode | P2 | XL | Queue writes; sync when online. |
| Multi-device sync | P2 | M | All data from DB; real-time optional. |
| Barcode scanning | P2 | M | Scan product or ingredient; lookup in DB. |
| Discounts and promotions | P2 | M | Coupons, % off; apply at order create. |

---

## 7. Database Schema Improvements

### 7.1 Tables (Supabase/Postgres)

**ingredients** (align with app and inventory)

```sql
-- Ensure columns exist; add if missing
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS current_stock numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_unit numeric,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS min_amount numeric DEFAULT 0;
-- id: UUID primary key (already).
```

**orders**

```sql
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,  -- e.g. FR-2025-00001
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','preparing','ready','completed','cancelled')),
  subtotal numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  notes text,
  customer_name text,
  customer_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE UNIQUE INDEX idx_orders_order_number ON orders(order_number);
```

**order_items**

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id int NOT NULL,  -- or uuid if products table
  product_name text,
  quantity int NOT NULL,
  unit_price numeric NOT NULL,
  line_total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

**payments**

```sql
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  method text NOT NULL CHECK (method IN ('cash','card','mock')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated','authorized','paid','failed','refunded')),
  amount_received numeric,
  change_due numeric,
  gateway_reference text,  -- Stripe pi_xxx
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
```

**inventory_transactions** (for audit and usage)

```sql
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES ingredients(id),
  quantity numeric NOT NULL,  -- negative = usage, positive = restock
  type text NOT NULL CHECK (type IN ('order','production','restock','adjustment')),
  reference_id uuid,  -- order_id or production_batch_id
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inventory_transactions_ingredient ON inventory_transactions(ingredient_id);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
```

**production_batches**

```sql
CREATE TABLE IF NOT EXISTS production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  batch_count int NOT NULL,
  produced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

### 7.2 RLS (Row Level Security)

- Enable RLS on `ingredients`, `orders`, `order_items`, `payments`, `inventory_transactions`, `production_batches`.
- Policies: service role or authenticated role can read/write as needed; anon can be restricted (e.g. read-only for menu, or no direct access and only via API using service key).

Example for **ingredients** (read for app, write for backend only):

```sql
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for anon" ON ingredients
  FOR SELECT USING (true);

CREATE POLICY "Allow all for service" ON ingredients
  FOR ALL USING (auth.role() = 'service_role');
```

Adjust for your auth model (e.g. authenticated staff vs anon).

### 7.3 Relationships

- `orders` 1 → N `order_items` (order_id).
- `orders` 1 → N `payments` (order_id); one “success” payment per order for simplicity.
- `inventory_transactions.ingredient_id` → `ingredients.id`.
- `inventory_transactions.reference_id` → `orders.id` or `production_batches.id` when type is order/production.

---

## 8. API Routes Needed

| Route | Method | Purpose | Priority | Complexity |
|-------|--------|---------|----------|------------|
| `/api/orders/create` | POST | Create order + order_items from cart; optional reserve; return order_number, order_id | P0 | M |
| `/api/orders/[id]/status` | PATCH | Update order status (e.g. paid → preparing → ready → completed) | P0 | S |
| `/api/orders/[id]` | GET | Get order + items for confirmation or kitchen | P0 | S |
| `/api/inventory/check` | POST | Accept cart; return { sufficient: boolean, short?: ingredient[] } | P0 | M |
| `/api/inventory/update` | POST/PATCH | Decrement (or adjust) stock; create inventory_transaction | P0 | M |
| `/api/payments/process` | POST | Record cash payment; update order to paid; trigger inventory decrement | P0 | M |
| `/api/payments/stripe-webhook` | POST | Stripe webhook; confirm payment, update order, inventory | P1 | L |
| `/api/reports/daily` | GET | Daily sales (orders, revenue by method); optional date range | P1 | S |
| `/api/reports/inventory` | GET | Current stock, low stock list | P1 | S |
| `/api/production/record` | POST | Record production batch; decrement inventory by recipe usage | P2 | M |

**Idempotency:** For `POST /api/orders/create` and payment processing, use `Idempotency-Key` header and store in `payments.idempotency_key` or a dedicated table to avoid duplicate orders on retry.

---

## 9. Frontend Components to Build

| Component | Purpose | Priority | Complexity |
|-----------|---------|----------|------------|
| Checkout page (or modal step) | Customer info, order summary, payment method selection | P0 | M |
| Payment form | Cash: amount received, change; Card: redirect or Stripe Elements | P0 | M |
| Order confirmation | Show order number, total, “Thank you”; link to receipt | P0 | S |
| Order history view | List orders from API (date, status, total); filter by status | P1 | S |
| Inventory dashboard | List ingredients with current_stock, unit, threshold; link to adjust | P1 | M |
| Low stock alerts | Banner or sidebar when any ingredient below threshold | P1 | S |
| Daily sales report | Table or cards: day, order count, revenue, payment mix | P1 | S |
| Kitchen display | Orders with status paid/preparing/ready; update status buttons | P2 | M |

Existing CartModal can stay for cart and “Pagar” entry; replace localStorage order/payment with API calls and redirect or confirmation view.

---

## 10. Implementation Roadmap

### Weeks 1–2: Core Order Processing (P0)

- **DB:** Create/alter `orders`, `order_items`, `payments`; add `order_number` generation (sequence or function).
- **API:** `POST /api/orders/create` (cart → order + items), `GET /api/orders/[id]`, `PATCH /api/orders/[id]/status`.
- **App:** Replace localStorage order-store with API: create order on “Pagar”, pass `order_id`/`order_number` to payment step; on complete call API to set status `paid` (and later persist payment).
- **Security:** RLS on orders, order_items, payments.

**Deliverable:** Orders and items stored in DB; order number shown; status updates via API.

### Weeks 3–4: Inventory Integration (P0)

- **DB:** Add `current_stock` (and if needed `price_per_unit`) to `ingredients`; create `inventory_transactions`.
- **API:** `POST /api/inventory/check`, `POST /api/inventory/update` (decrement on order paid).
- **Flow:** On order create (or pay), backend computes recipe usage, decrements stock, inserts `inventory_transactions`.
- **App:** Before creating order, call inventory check; block checkout if insufficient; show message.

**Deliverable:** Inventory checked at checkout; stock decremented when order is paid.

### Weeks 5–6: Payment Processing (P1)

- **API:** `POST /api/payments/process` (cash: amount, change, order_id); Stripe PaymentIntent create + webhook.
- **DB:** Ensure `payments` table and link to orders; idempotency key for payment.
- **App:** Cash flow already in UI; wire to API. Card: redirect to Stripe or embedded form; webhook sets order paid and runs inventory decrement.

**Deliverable:** Cash and card payments persisted; reconciliation possible.

### Weeks 7–8: Reports and Optimization (P1–P2)

- **API:** `/api/reports/daily`, `/api/reports/inventory`.
- **App:** Dashboard with daily sales, inventory view, low stock alerts.
- **Optional:** Kitchen view, receipt generation, production batch API.

**Deliverable:** Basic reporting and visibility; foundation for receipts and production.

---

## Security Considerations

- **RLS:** Enable on all POS tables; limit anon to what’s strictly needed (e.g. read menu); use service role or authenticated role for orders, payments, inventory.
- **API:** Validate input (cart, amounts); enforce idempotency for order and payment creation; rate limit if public.
- **Secrets:** Stripe webhook secret, Supabase service key, and API keys only on server; never expose in client.
- **Audit:** Log order and payment creation and status changes; use `inventory_transactions` for stock changes.

---

## Dependency Overview

```
Orders in DB (P0)
    → Order number, status flow
    → Payments in DB (P0)
    → Inventory check (P0) → Inventory decrement on paid (P0)
    → Stripe (P1) depends on Payments in DB
    → Receipt (P1) depends on Orders + Payments
Reports (P1) depend on Orders, Payments, Inventory
Kitchen display (P2) depends on Orders API
```

---

*This plan aligns the Funny Rolls codebase with a production-ready POS: single source of truth in the database, inventory-aware checkout, and a clear path to real payments and reporting.*
