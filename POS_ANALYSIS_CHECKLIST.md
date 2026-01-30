# POS Bakery App — Analysis & Prioritized Checklist

**Scope:** Funny Rolls codebase as a POS-style bakery app (menu, cart, calculator, production).  
**Output:** Prioritized checklist by domain. No code modifications.

---

## Summary

The app is a **marketing site + back-office cost calculator**, not a full POS. The “POS-like” surface is the home page (menu + cart + contact). Cart has no checkout, no order creation, and no link to payments, receipts, or inventory. The calculator handles costing and production tracking but is separate from sales. Adding real in-store POS and payments will require new order/payment flows, persisted state, and architectural cleanup.

---

## Domain 1 — Orders & Cart

**Priority: P0 (Critical for POS)**

| # | Item | Type | Notes |
|---|------|------|-------|
| 1.1 | **No checkout flow** | Missing feature | “Pagar” has no `onClick`; checkout never starts. |
| 1.2 | **Cart is in-memory only** | Missing feature | Cart lives in `useState`. Refresh or navigation clears it. No `localStorage` or session persistence for cart. |
| 1.3 | **`Order` / `OrderItem` unused** | Missing feature | Types exist in `lib/types.ts`. No order creation, persistence, or API. Cart never becomes an Order. |
| 1.4 | **No order persistence** | Missing feature | No Supabase (or other) table for orders; no order history or lookup. |
| 1.5 | **No order status workflow** | Missing feature | `Order.status` (pending → completed, etc.) defined but never used. No preparing/ready/fulfilled flow. |
| 1.6 | **Cart ↔ WhatsApp is not “order”** | Missing feature | Contact form sends generic message (name, phone, message). Cart is never serialized into an order summary or sent to WhatsApp. |
| 1.7 | **No order → inventory link** | Missing feature | Inventory is decremented only on “record production” (calculator). Sales/cart never deduct stock. |
| 1.8 | **Product ID collision risk** | Architectural | DB recipes become products with `id: parseInt(recipe.id.replace('recipe-','')) \|\| Date.now()`. Can collide with static product IDs (1–6); `Date.now()` is unstable. |
| 1.9 | **Cart doesn’t use `Order`** | Architectural | Cart uses `CartItem[]` (Product + quantity). No mapping to `Order` / `OrderItem`; duplicate concepts. |
| 1.10 | **`customizations` / `specialInstructions` unused** | Missing feature | On `CartItem` and `OrderItem` but never set or shown in CartModal or add-to-cart flow. |

**Key files:** `app/page.tsx`, `components/sections/CartModal.tsx`, `lib/types.ts` (`Order`, `OrderItem`, `CartItem`).

---

## Domain 2 — Payments

**Priority: P0 (Critical for POS)**

| # | Item | Type | Notes |
|---|------|------|-------|
| 2.1 | **No payment integration** | Missing feature | No Stripe, PayPal, or other processor. No payment intents, webhooks, or success/failure handling. |
| 2.2 | **No tender types** | Missing feature | No cash vs card vs other; no “amount tendered” or change calculation. |
| 2.3 | **No payment state machine** | Missing feature | No initiated → authorized → captured → refunded (or similar) flow. |
| 2.4 | **No receipts** | Missing feature | `react-to-print` used for **recipe** (calculator) only. No customer receipt or order ticket printing. |
| 2.5 | **No idempotency for payments** | Technical debt | No idempotency keys or idempotent order creation. Retries could create duplicate charges or orders. |
| 2.6 | **No secure server-side payment flow** | Technical debt | Payment APIs must run server-side (e.g. Stripe). Current API is upload-only; no payment routes or server-side order creation. |
| 2.7 | **“Pagar” is dead UI** | UI gap | Button exists but has no handler. Blocks any payment UX. |

**Key files:** `components/sections/CartModal.tsx`, `app/api/`, `package.json` (`react-to-print`).

---

## Domain 3 — State & Architecture

**Priority: P0 (Critical for POS)**

| # | Item | Type | Notes |
|---|------|------|-------|
| 3.1 | **Cart state only on home page** | Architectural | Cart lives in `app/page.tsx`. Calculator (`/recipe-calculator`) has separate state. No global cart, no shared “session” or register. |
| 3.2 | **No order service / repository** | Architectural | Order create, update, fetch not abstracted. No clear place to add payment-triggered order creation. |
| 3.3 | **Tools state duplicated** | Architectural | `IngredientsPanel` keeps local `tools` from `defaultTools`; parent `RecipeCalculator` has its own `tools`. Edits in Tools panel don’t affect calculator. Two sources of truth. |
| 3.4 | **Calculator state not shared with POS** | Architectural | Ingredients, recipes, inventory, production live in calculator + `localStorage`. Menu/cart use different data (products, DB recipes). No shared catalog or inventory for “sold” units. |
| 3.5 | **Production tracker changes not persisted** | Architectural | `updateProductionStatus` / `addProductionItem` not passed from parent. Item status changes and new items are local-only; lost on refresh. |
| 3.6 | **No user / clerk / shift** | Missing feature | No auth. No clerk identification, shift start/end, or till attribution for orders or payments. |
| 3.7 | **Mutability of shared data** | Architectural | `updateRecipeInProducts` mutates `products` from `lib/data`. Shared mutable state complicates reasoning and tests. |

**Key files:** `app/page.tsx`, `app/recipe-calculator/page.tsx`, `components/RecipeCalculator/RecipeCalculator.tsx`, `components/RecipeCalculator/IngredientsPanel.tsx`, `lib/utils.ts`, `lib/data.ts`.

---

## Domain 4 — Calculations & Pricing

**Priority: P1 (High)**

| # | Item | Type | Notes |
|---|------|------|-------|
| 4.1 | **No tax or discounts in cart** | Missing feature | `getTotalPrice` is `sum(price * quantity)`. No tax, no discounts, no modifiers. |
| 4.2 | **Price display inconsistency** | UI gap | Menu uses `$X.00`; cart uses `toFixed(2)`. No single “display price” or currency formatting abstraction. |
| 4.3 | **Margin/cost logic inconsistent with tools** | Architectural | `updateRecipeSellingPrice` and `PrintableRecipe` use cost/profit/margin **without tools**. `costPerItem` elsewhere includes tools. Same recipe can show different margins. |
| 4.4 | **RecipeManagerModal preview ignores `containsAmount`** | Architectural | Cost preview uses `ingredient.price * amount` instead of `getIngredientCostPerUnit`; wrong for non-standard units. |
| 4.5 | **Missing ingredients (IDs 9–13)** | Architectural | Recipes reference these IDs; `defaultIngredients` doesn’t. Cost math can hit `undefined` and produce NaNs. |
| 4.6 | **No clear “sellable unit” vs “batch”** | Missing feature | Products are recipe-based; batch size exists in calculator but isn’t exposed to POS. No explicit “price per unit” vs “batch” model for sales. |

**Key files:** `app/page.tsx` (`getTotalPrice`), `components/sections/CartModal.tsx`, `components/sections/MenuSection.tsx`, `lib/utils.ts`, `components/RecipeCalculator/RecipeManagerModal.tsx`, `components/RecipeCalculator/PrintableRecipe.tsx`, `lib/data.ts`.

---

## Domain 5 — UI/UX for In-Store Use

**Priority: P1 (High)**

| # | Item | Type | Notes |
|---|------|------|-------|
| 5.1 | **Marketing layout, not POS layout** | UI gap | Home is hero → menu → about → contact. No compact “register” view, no primary focus on cart + quick add. |
| 5.2 | **No quick-add or numpad** | UI gap | No quantity numpad, no barcode scan input, no “last order” or favorites for fast repetition. |
| 5.3 | **No keyboard shortcuts** | UI gap | No hotkeys for add-to-cart, open cart, checkout, etc. |
| 5.4 | **Cart modal only** | UI gap | Cart is a modal. No dedicated cart/checkout page, no persistent cart strip for in-store workflows. |
| 5.5 | **No customer-facing display** | UI gap | No second screen or print preview for customer (totals, items) during checkout. |
| 5.6 | **No receipt or order ticket** | UI gap | Nothing to print for customer or kitchen. Recipe print is for costing, not transactions. |
| 5.7 | **Touch targets** | UI gap | Some buttons and inputs are small. Mobile CSS improves flip-card usage but menu + cart not optimized for fat-finger, glove-friendly use. |
| 5.8 | **Offline / flaky network** | UI gap | No offline support. Supabase fetch and API calls assume connectivity; cart lost on refresh. |
| 5.9 | **Availability only at add-to-cart** | UI gap | “Sold out” disables button; no live reserve or real-time availability. Multi-tab/multi-device can oversell. |
| 5.10 | **No table / seat / order type** | UI gap | No “for here / to go,” table number, or order type for fulfillment. |

**Key files:** `app/page.tsx`, `components/sections/*`, `app/globals.css`, layout structure.

---

## Domain 6 — Technical Debt Blocking Payments Later

**Priority: P0 (Critical)**

| # | Item | Type | Notes |
|---|------|------|-------|
| 6.1 | **No order entity in use** | Blocking | Payments require a stable order (or basket) to attach to. Cart is ephemeral; no Order creation or ID. |
| 6.2 | **No idempotent order creation** | Blocking | Retries (e.g. after payment confirmation) can create duplicate orders. Need idempotency keys and “create once” semantics. |
| 6.3 | **No auth** | Blocking | Upload API has no auth; app has no user/session. Payment providers and order attribution need identified actors (clerk, device, or customer). |
| 6.4 | **No server-side order API** | Blocking | Order create/update and payment orchestration must run server-side. Only `/api/upload` exists; no order or payment routes. |
| 6.5 | **Cart not serializable to Order** | Blocking | Cart is `CartItem[]` (Product + quantity). Order expects `OrderItem[]` (productId, quantity, customizations). No mapping, and customizations never collected. |
| 6.6 | **Product ID shape** | Blocking | `OrderItem.productId` is `number`. DB-derived products use `parseInt(recipe.id...)` or `Date.now()`. Collisions and instability complicate reconciliation and refunds. |
| 6.7 | **No webhook or async payment handling** | Blocking | No webhook route for provider callbacks (e.g. Stripe). No “payment confirmed” → update order → receipt flow. |
| 6.8 | **PII in WhatsApp URL** | Blocking | Contact form builds `wa.me` with name, phone, message. Cart→WhatsApp would add order details. No structured handling of PII or PCI considerations for future payment flows. |

**Key files:** `app/api/`, `app/page.tsx`, `components/sections/CartModal.tsx`, `lib/types.ts`, `lib/supabase.ts`, contact/WhatsApp flow.

---

## Domain 7 — Inventory & Production

**Priority: P1 (High for full POS)**

| # | Item | Type | Notes |
|---|------|------|-------|
| 7.1 | **Inventory tied to production, not sales** | Architectural | Stock decremented only on “record production.” Sales/cart don’t reduce inventory. |
| 7.2 | **No sellable-unit inventory** | Missing feature | Inventory is ingredient-level (calculator). No per-product or per-SKU “units available” for POS. |
| 7.3 | **Production status changes not persisted** | Architectural | Production tracker updates are local-only; not saved to `productionHistory` or DB. |
| 7.4 | **“Sold” in production vs “sold” in POS** | Architectural | Production uses “good / sold / bad / …” for batch outcomes. No link to POS “sold” (transacted) units. |

**Key files:** `components/RecipeCalculator/RecipeCalculator.tsx`, `components/RecipeCalculator/ProductionTrackerPanel.tsx`, `lib/types.ts` (`InventoryItem`, `ProductionRecord`).

---

## Prioritized Checklist (Grouped by Domain)

Use this as a **checklist** to close gaps before treating the app as a real in-store POS or adding payments.

### P0 — Critical (must address before POS / payments)

- **Orders & Cart:** 1.1–1.7, 1.9  
- **Payments:** 2.1–2.4, 2.7  
- **State & Architecture:** 3.1–3.4  
- **Technical Debt (Payments):** 6.1–6.7  

### P1 — High (needed for solid in-store POS)

- **Orders & Cart:** 1.8, 1.10  
- **Payments:** 2.5, 2.6  
- **State & Architecture:** 3.5–3.7  
- **Calculations & Pricing:** 4.1–4.6  
- **UI/UX for In-Store:** 5.1–5.10  
- **Inventory & Production:** 7.1–7.4  

### P2 — Medium (improvements once P0/P1 are in place)

- Refine receipt layout, customer display, and offline behavior.  
- Add clerk/shift, better tooling for reconciliation and reporting.

---

## Domain → File Map (Quick Reference)

| Domain | Main files |
|--------|------------|
| Orders & Cart | `app/page.tsx`, `CartModal.tsx`, `MenuSection.tsx`, `lib/types.ts` |
| Payments | `CartModal.tsx`, `app/api/*`, `Contact.tsx` (WhatsApp) |
| State & Architecture | `app/page.tsx`, `recipe-calculator/page.tsx`, `RecipeCalculator.tsx`, `IngredientsPanel.tsx`, `lib/utils.ts`, `lib/data.ts` |
| Calculations & Pricing | `lib/utils.ts`, `RecipeManagerModal.tsx`, `PrintableRecipe.tsx`, `lib/data.ts` |
| UI/UX In-Store | `app/page.tsx`, `components/sections/*`, `globals.css` |
| Technical Debt (Payments) | `app/api/*`, `lib/types.ts`, `lib/supabase.ts`, cart/checkout/contact flows |
| Inventory & Production | `RecipeCalculator.tsx`, `ProductionTrackerPanel.tsx`, `lib/types.ts` |

---

**End of POS Analysis Checklist.**
