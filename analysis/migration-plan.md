# Migration Plan

Generated at: 2026-03-12T19:17:09.466Z

## Phase 1 – Stabilize production data model & identifiers

**Goals:**

- Stop all 500s from schema mismatches (e.g. missing columns)
- Ensure every core table has a stable primary key strategy
- Preserve existing production data during migrations

**Steps:**


## Phase 2 – Introduce orders, customers and inventory enforcement

**Goals:**

- Persist all sales as structured orders
- Link orders to production batches for traceability
- Tie inventory movements to orders and production

**Steps:**


## Phase 3 – Cost calculation, production planning and shopping lists

**Goals:**

- Use real supplier prices for all cost calculations
- Drive ingredient shopping lists from planned production and current stock
- Align production statuses with UI flows (planned → in_progress → completed)

**Steps:**

- **p3-ingredient-pricing** – Harden ingredient pricing model
  - Ensure ingredients table includes price_per_unit, current_stock, reorder_level and category; migrate any legacy price fields and update all cost calculations to use these columns.
- **p3-production-planning** – Add planning metadata to production_batches
  - Introduce planned_at / planned_for dates, per-batch status (planned, in_progress, completed) and link batches to orders, enabling shopping lists and capacity planning.

## Phase 4 – Reporting, CFDI and SAT-compliant operations

**Goals:**

- Provide reliable financial and operational reporting
- Support SAT/CFDI invoicing for qualifying sales
- Enable CSV/Excel exports for accountants and management

**Steps:**

- **p4-financial-views** – Create reporting views for sales and production
  - Add database views (and optional materialized views) that aggregate daily/monthly sales, product mix, and production yields to power dashboards and export endpoints.
- **p4-cfdi-sat-integration** – Prepare CFDI/SAT integration
  - Extend orders with SAT-required fields (uso CFDI, RFC, regimen fiscal) and design an integration layer to generate CFDI documents via a PAC, ensuring Chihuahua/México commercial compliance.
