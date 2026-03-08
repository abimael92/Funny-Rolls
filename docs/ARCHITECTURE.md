# Funny Rolls — Architecture

## Overview

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Data:** Supabase (PostgreSQL) for orders, order_items, payments, ingredients, recipes, inventory_transactions, production_batches. Optional localStorage fallback for orders/payments when API is not configured.
- **Payments:** Cash (stored in DB), mock (testing), Stripe for card (optional).

## Data flow

1. **Menu / products:** From `lib/data.ts` (mock) and Supabase `recipes` (merged on home page).
2. **Cart:** React state in `app/page.tsx`; not persisted.
3. **Checkout:** User clicks "Pagar" → `createOrderApi(cart)` (POST `/api/orders/create`) creates order in DB with `order_number`, or falls back to localStorage. Order id (UUID or local) is stored as `checkoutOrderId`.
4. **Payment:** User selects cash or mock and completes → `completeOrderApi(orderId, payload)` (POST `/api/orders/[id]/complete`) updates order to `paid`, creates payment row, and decrements inventory (for items with `recipe_id`). If API unavailable, localStorage flow runs.
5. **Inventory:** `ingredients.current_stock` updated by `/api/orders/[id]/complete` (order usage) and `/api/inventory/adjust` (restock/adjustment). `inventory_transactions` logs every change.
6. **Kitchen:** `/kitchen` page polls `/api/kitchen/orders` and updates status via `/api/kitchen/orders/[id]/status`.
7. **Receipts:** `/api/receipts/[orderId]/html` returns HTML receipt; email/print are stubs.

## Service layer

- **Client:** `lib/services/*` (products, ingredients, tools, orders, payments, cart totals, daily summary) — read-only from UI; orders/payments written via `lib/order-api.ts` (API) or existing localStorage services.
- **Server:** `lib/supabase-server.ts` (Supabase admin client), `lib/inventory-service.ts`, `lib/receipt-service.ts`. Used only in API routes.

## Key files

| Area | Files |
|------|--------|
| Order creation | `app/api/orders/create/route.ts`, `lib/order-api.ts` |
| Order complete (pay + inventory) | `app/api/orders/[id]/complete/route.ts` |
| Payments | `app/api/payments/create/route.ts`, `create-intent/route.ts`, `webhook/route.ts` |
| Inventory | `lib/inventory-service.ts`, `app/api/inventory/*` |
| Kitchen | `app/kitchen/page.tsx`, `app/api/kitchen/orders/*` |
| Receipts | `lib/receipt-service.ts`, `app/api/receipts/[orderId]/*` |
