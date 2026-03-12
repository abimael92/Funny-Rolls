# Current Application State

## 📊 Executive Summary

| Module                         | Status           | Notes                                      |
|--------------------------------|------------------|--------------------------------------------|
| Landing / Menu                 | ✅ Online        | Uses Tailwind amber/brown theme            |
| Auth / Profiles                | ✅ Basic         | Supabase auth + profiles table             |
| Recipe Calculator              | ⚠️ Mixed data   | Combines mock/local data and Supabase      |
| Production Batches             | ⚠️ Partial       | API recently fixed; schema alignment in progress |
| Inventory                      | ⚠️ Partial       | Ingredients table present; flows incomplete |
| Orders / Clients               | ❌ Missing       | Tables and flows not fully implemented     |
| Reports / Dashboard            | ⚠️ Limited       | Some daily/monthly endpoints, no full P&L  |
| Admin UI (Dashboard, Inventory)| ⚠️ In progress   | New pages scaffolded, wiring ongoing       |

## 🗄️ Current Database

> This section is intended to be generated and kept in sync by `scripts/analyze-database.ts`.  
> Run that script to refresh the details below once the database is stable.

- **Core tables (observed)**
  - `recipes`: stores recipe definitions (`ingredients`, `batch_size`, pricing fields).
  - `ingredients`: tracks ingredient master data and stock-related columns.
  - `production_batches`: records production events for recipes.
  - `inventory_transactions`: logs stock movements.
  - `profiles`: application user profiles and roles.

- **Key characteristics**
  - IDs are a **mix of numeric and UUID** in some tables.
  - `production_batches` currently uses `quantity_produced` (no `batch_count` in DB).
  - Some RLS policies allow public read, with service-role policies for write operations.

## 🧩 Components and Dependencies

- **Core components**
  - `RecipeCalculator` and panels under `components/RecipeCalculator/*`
    - Depend on:
      - `lib/types.ts` domain models (`Recipe`, `Ingredient`, `ProductionRecord`, etc.).
      - `lib/services` for product/recipe helpers (some still mock-based).
      - `lib/supabase` client for live DB access.
  - Admin pages under `app/admin/*`
    - Dashboard uses `/api/reports/sales/*`, `/api/orders/history`, `/api/inventory/alerts`.
    - Production page uses `/api/production/record` and `/api/production/history`.

- **Mock / local data dependencies**
  - `lib/services` includes helpers that return **hardcoded products/recipes**.
  - `RecipeCalculator` still seeds local state from those helpers before merging Supabase data.
  - Some inventory and production history were previously stored in `localStorage`.

## 🚨 Critical Issues

1. **Schema / API mismatches**
   - API routes previously referenced non-existent columns (e.g., `batch_count`), causing 500s.
2. **Inconsistent identifiers**
   - Recipes, ingredients, and production batches mix numeric IDs and UUIDs, complicating joins and migrations.
3. **Mock data in critical flows**
   - Recipe and costing logic still depend on hardcoded product/recipe lists instead of authoritative DB tables.
4. **Orders and clients incomplete**
   - No robust `orders` / `clients` / `order_items` model yet; POS and online sales are not fully normalized.
5. **Inventory not single source of truth**
   - Some flows adjust stock locally or not at all; inventory is not yet the canonical source for availability and shopping lists.

## 📉 Risks

- **Operational risk**
  - Misaligned schema and mixed IDs can cause silent data loss or double-counting in production/stock when APIs change.
- **Financial risk**
  - Cost and margin calculations based on mock or stale prices can lead to underpricing and hidden losses.
- **Scalability risk**
  - Without normalized orders, clients, and inventory movements, adding channels (online, wholesale) or auditing history will be fragile.
- **Regulatory risk (Mexico / SAT)**
  - Current model does not yet capture all fields required for CFDI (RFC, uso CFDI, payment method codes), making later compliance harder if not designed upfront.

