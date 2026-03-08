# Funny Rolls – Comprehensive Codebase Audit Report

**Date:** March 8, 2026  
**Scope:** Authentication, admin routes, data flow, persistency, UI/UX, missing features, technical debt, performance, testing, deployment.

---

## 1. Executive Summary

### Current State
- **Stack:** Next.js 15 (App Router), Supabase (Postgres), Stripe (optional), AWS S3 (recipe images).
- **Auth:** No authentication implemented. Supabase client uses anon key; API routes use service role. `profiles` table exists with roles (admin, manager, staff, viewer) but is unused.
- **Routes:** Homepage/menu (`/`), recipe calculator (`/recipe-calculator`), kitchen display (`/kitchen`). No `/admin/*` routes.
- **Data:** Orders can be created and completed via API (DB); fallback to localStorage when API fails. Cart, production history, and calculator state use localStorage. Daily sales “Resumen” on homepage reads from localStorage only.
- **Critical gaps:** No login, no RBAC, no protected routes, admin routes missing, tablet panel spacing issue, recipe ingredient ID mismatch (numeric vs UUID) in DB recipe data.

### Critical Issues
1. **No authentication** – Anyone can access calculator, kitchen, and all APIs.
2. **No role-based access** – Admin/staff/viewer roles exist in schema but are not enforced.
3. **Admin routes missing** – No dashboard, inventory UI, reports UI, user management, or settings.
4. **Tablet spacing** – Recipe calculator panels have no spacing between them at 640px–1024px (invalid `md:mb-8!` and grid only at `lg`).
5. **Initial inventory** – All ingredients at 0 stock; no seed or UI to set initial stock.
6. **Order flow** – `recipe_id` is in migrations and API; ensure DB has column and front-end always sends it for inventory decrement.

### Next Steps (Prioritized)
- **P0:** Add Supabase Auth (email/password), protect `/recipe-calculator` and `/kitchen`, fix tablet spacing, confirm `order_items.recipe_id` and set initial stock.
- **P1:** Build admin layout and dashboard, inventory UI, reports UI, order management, user management; wire “Resumen” to DB.
- **P2:** Customer accounts, loyalty, discounts, barcode, export, audit logs, offline sync.

---

## 2. Detailed Findings

### 2.1 AUTHENTICATION & AUTHORIZATION

| Item | Status | Notes |
|------|--------|--------|
| Auth system | ❌ Missing | No NextAuth, no Supabase Auth UI. Only Supabase client (anon) + server (service role). |
| User/profiles tables | ✅ Exists | `profiles` in migration `20250130000005_profiles.sql`: id, email, full_name, role (admin, manager, staff, viewer). No `user_id` FK to `auth.users` in migration. |
| Protected routes | ❌ None | No middleware or checks. `/`, `/recipe-calculator`, `/kitchen` are all public. |
| Login page | ❌ Missing | No email/password or OAuth flow. |
| RBAC | ❌ Missing | Roles in DB only; no checks in app or API. |
| Session management | ❌ Missing | No server or client session. |
| Protected API routes | ❌ None | All API routes use `supabaseAdmin` (service role); no user/session validation. |
| Admin-only areas | ❌ None | Calculator and kitchen are public. |
| Staff vs customer views | ❌ Not implemented | Single experience for all. |

**What’s missing for a complete auth system:**
- Login page (email/password or magic link via Supabase Auth).
- Supabase Auth integration and optional sync to `profiles` (with `user_id` if using auth.users).
- Middleware or layout checks to protect `/recipe-calculator`, `/kitchen`, and all `/admin/*` and `/api/*` that should be restricted.
- RBAC: resolve user role (from `profiles` or JWT) and allow/deny by route and action.
- Session handling (Supabase client session or NextAuth session).
- Admin-only: calculator, reports, inventory, user management, settings.

---

### 2.2 ADMIN ROUTES & LINKS

**Current routes:**

| Route | Purpose |
|-------|--------|
| `/` | Homepage / menu; cart; daily “Resumen” (localStorage). |
| `/recipe-calculator` | Cost calculator, ingredients, tools, production tracker. |
| `/kitchen` | Kitchen display (orders paid/preparing); polling every 10s. |
| `/api/orders/create` | Create order (DB). |
| `/api/orders/[id]` | Get order. |
| `/api/orders/[id]/status` | Update order status. |
| `/api/orders/[id]/complete` | Complete payment, update stock. |
| `/api/orders/history` | List orders (filter by status). |
| `/api/orders/next-number` | Next order number (RPC). |
| `/api/kitchen/orders` | Orders for kitchen (status=paid,preparing). |
| `/api/kitchen/orders/[id]/status` | Update kitchen order status. |
| `/api/payments/create` | (Legacy/mock payment.) |
| `/api/payments/create-intent` | Stripe PaymentIntent. |
| `/api/payments/webhook` | Stripe webhook. |
| `/api/inventory/check` | Check stock. |
| `/api/inventory/adjust` | Adjust stock. |
| `/api/inventory/alerts` | Low stock. |
| `/api/inventory/transactions` | List transactions. |
| `/api/production/record` | Record production batch, deduct ingredients. |
| `/api/production/history` | Production history. |
| `/api/reports/sales/daily` | Daily sales (DB). |
| `/api/reports/sales/monthly` | Monthly sales (DB). |
| `/api/receipts/[orderId]/html` | Receipt HTML. |
| `/api/receipts/[orderId]/pdf` | Receipt PDF. |
| `/api/receipts/[orderId]/email` | Email receipt. |
| `/api/receipts/[orderId]/print` | Print receipt. |
| `/api/upload` | S3 recipe image upload. |

**Missing admin routes (should exist):**

- `/admin` or `/admin/dashboard` – Main admin dashboard (metrics, shortcuts).
- `/admin/inventory` – Inventory management UI (stock, reorder, adjustments).
- `/admin/reports` – Sales reports (daily/weekly/monthly, charts).
- `/admin/orders` – Order list and detail.
- `/admin/production` – Production tracking (or reuse calculator production panel under admin).
- `/admin/users` – User/staff CRUD and roles.
- `/admin/settings` – System settings (tax, store info, etc.).
- `/admin/recipes` – Recipe CRUD (or link to calculator + DB).

**Navigation:**  
Navbar links: Inicio, Menú, Acerca de, Contacto, **Calculadora** (to `/recipe-calculator`). No link to `/kitchen` or any admin. Kitchen is only reachable by URL. No admin menu.

---

### 2.3 DATA FLOW VERIFICATION

#### Orders flow
- **Cart → Order creation → DB:** ✅  
  - Homepage cart uses `createOrderApi()` → `POST /api/orders/create` with `items` (productId, productName, quantity, unitPrice, lineTotal, **recipeId**).  
  - Create route inserts `orders` (order_number, status, subtotal, tax, total, notes, customer_*) and `order_items` (order_id, product_id, product_name, quantity, unit_price, line_total, **recipe_id**).  
  - If API fails, fallback uses `startCheckout()` and localStorage.
- **Order status:** ✅  
  - Status updated via `/api/orders/[id]/status` and kitchen `/api/kitchen/orders/[id]/status`. Allowed: pending → paid (on complete) → preparing → ready → completed (and cancelled).
- **Order history:** ✅  
  - `GET /api/orders/history?status=...` and order detail `GET /api/orders/[id]`.
- **Kitchen real-time:** ⚠️ Polling every 10s; no Supabase Realtime.

#### Inventory flow
- **Schema:** ✅  
  - Migrations: `ingredients` has `current_stock`, `price_per_unit`, `reorder_level`; `inventory_transactions` has quantity, type, reference_id, notes.
- **Stock decrement on order completion:** ✅  
  - `POST /api/orders/[id]/complete` marks order paid, inserts payment, then for each order_item with `recipe_id` loads recipe, computes usage per ingredient, and calls `updateStock(ingId, -usage, "order", orderId, ...)`.
- **Stock increment from production:** ❌  
  - Production recording **consumes** ingredients: `updateStock(ingId, -totalQty, "production", ...)`. There is no “restock” or “production output” that increases stock (by design: production uses ingredients; finished goods are not tracked in ingredients table).
- **Low stock:** ✅  
  - `getLowStockItems()` and `/api/inventory/alerts` (if implemented) use `reorder_level`.
- **Transactions logged:** ✅  
  - `updateStock` updates `ingredients.current_stock` and inserts into `inventory_transactions` (ingredient_id, quantity, type, reference_id, notes).

#### Payment flow
- **Cash:** ✅  
  - CartModal → `completeOrderApi` → `POST /api/orders/[id]/complete` with paymentMethod `cash`, amountReceived, changeDue. Order set to paid, payment row inserted.
- **Card (Stripe):** ✅  
  - `create-intent` and `webhook` exist; webhook creates payment record. No full checkout UI flow verified.
- **Payment records:** ✅  
  - `payments` table (order_id, method, amount, status, amount_received, change_due, idempotency_key).
- **Receipt:** ✅  
  - `/api/receipts/[orderId]/html` (and pdf/print/email) use order + order_items from DB.

#### Production flow
- **Recipe → Batch → Inventory:** ✅  
  - `POST /api/production/record` with recipeId, batchCount, optional ingredientsUsed. Inserts `production_batches`, then either uses provided ingredientsUsed or recipe ingredients to call `updateStock(ingId, -totalQty, "production", batch.id, ...)`.
- **Production records:** ✅  
  - `production_batches` (recipe_id, recipe_name, batch_count, produced_at); history API reads from it.

#### Recipe/calculator flow
- **Ingredient costs → recipe cost:** ✅  
  - Calculator uses ingredient prices and batch size; tool amortization in ToolsPanel.
- **Selling price / margin:** ✅  
  - Recipe model has sellingPrice, profitMargin; calculations in lib.
- **Recipe versions / change tracking:** ❌  
  - Not implemented; recipes are single version.

---

### 2.4 DATA PERSISTENCY

| Data | Storage | Sync to DB |
|------|--------|------------|
| Calculator state (ingredients, tools, recipes) | localStorage keys + Supabase | Ingredients/tools/recipes loaded and saved to Supabase from UI; localStorage used for persistence on calculator. |
| Cart items | React state (in-memory) | No; cleared on checkout. |
| Production history (calculator) | localStorage + optional API | Production tracker can use local state; recording can go to `/api/production/record`. |
| Inventory (calculator) | Local state + Supabase | Ingredients table has current_stock; adjustments can go to API. |
| Orders (after checkout) | DB via API; fallback localStorage | When API works, orders in DB; when not, only in order-store (localStorage). |
| Daily “Resumen” (homepage) | localStorage only | `getDailySalesSummary()` from order-store; not from DB. |

- **Sync:** No automatic sync between localStorage and DB for orders/sales. Resumen should be switched to DB (e.g. `/api/reports/sales/daily`).
- **Page refresh:** Cart is lost (in-memory). Calculator state and production history can be restored from localStorage and/or DB.
- **Offline:** No PWA or IndexedDB; no offline queue or sync.

---

### 2.5 UI/UX & RESPONSIVENESS

- **Mobile (<640px):** Tabs for calculator (ingredients / calculator / production); Navbar collapses to menu; touch targets present. Adequate.
- **Tablet (640px–1024px):** **Issue:** Recipe calculator uses `lg:grid lg:grid-cols-3 lg:gap-8` and `space-y-8 lg:space-y-0`. Below `lg`, panels stack with `space-y-8`, but panels use `md:mb-8!` (invalid Tailwind: `!` position wrong). So **tablet spacing between panels is broken**. Fix: use valid margin/gap (e.g. `mb-6 md:mb-8` or `gap-6 md:gap-8`) and ensure vertical rhythm.
- **Desktop (≥1024px):** Three-column grid with gap; OK.
- **Touch targets:** Buttons and nav items are reasonably sized.
- **Loading:** Kitchen page has loading state; calculator and others partial.
- **Error handling:** API errors often only in console; toasts or inline errors not consistent.
- **Form validation:** Some (e.g. production batch count); not systematic across forms.

---

### 2.6 MISSING FEATURES (Summary)

- **P0:** Auth, RBAC, protected admin routes, tablet spacing fix, `order_items.recipe_id` confirmed and sent from front-end, initial inventory stock set.
- **P1:** Admin dashboard, sales reports UI, inventory UI, low-stock alerts in UI, order management UI, user management, receipt print/email, kitchen improvements, recipe ingredient IDs (numeric vs UUID) fixed in data.
- **P2:** Customer accounts, loyalty, discounts, barcode, multiple payment methods, tax config, export CSV/PDF, email notifications, shift management, audit logs, backup/restore, dark mode, i18n, offline sync.

---

### 2.7 TECHNICAL DEBT & FIXES

**Database**
- `order_items.recipe_id`: ✅ Added in migration `20250130000007_order_items_recipe_id.sql`. Create route and order-api send it. Ensure all order creation paths send `recipeId` where applicable.
- Recipe ingredients: Recipe in DB may still use numeric IDs; setup script maps names to UUIDs. Run mapping/update so recipe.ingredients use ingredient UUIDs.
- Foreign keys: Migrations define FKs (orders, order_items, payments, inventory_transactions, production_batches). Profiles not linked to auth.users.
- Indexes: Present on status, created_at, order_number, ingredient_id, etc.
- RLS: Enabled on all tables; policies allow service_role and often public read. When auth is added, restrict write/read by role.

**Code**
- TypeScript: Kitchen route uses `const db = supabaseAdmin` and early return if !db; no obvious type error. Run `pnpm build` to confirm.
- AWS SDK: Both `aws-sdk` (v2) and `@aws-sdk/client-s3` (v3) in package.json; upload route uses v3 only. Remove v2 if unused elsewhere.
- console.log: Present in upload route and others; remove or gate for production.
- Error handling: Standardize API error responses and client feedback.
- Input validation: Add validation (e.g. Zod) for API bodies and query params.
- Hardcoded values: e.g. tax in calculations; move to config/settings.
- Large components: RecipeCalculator, RecipeManagerModal, ProductionTrackerPanel are large; consider splitting.

**Security**
- No auth on routes; anyone can call APIs.
- Service role used only server-side (supabase-server); not exposed to client.
- Env: No `.env.example` in repo; document all vars (Supabase URL/keys, Stripe, AWS, SendGrid/Resend).

---

### 2.8 PERFORMANCE

- **Bundle:** No bundle analysis script; consider `@next/bundle-analyzer`.
- **Images:** Next.js Image used on menu; recipe images from S3.
- **Lazy loading:** Recipe calculator not dynamically imported; consider `next/dynamic` for heavy panels.
- **API:** No caching headers or Redis; DB-only.
- **Queries:** Single-table queries and small joins; indexes exist. Watch N+1 if order history grows (batch items).
- **Caching:** No explicit cache layer.

---

### 2.9 TESTING

- **Unit / integration / E2E:** No test framework in package.json (no Jest, Vitest, Playwright).
- **Coverage:** None.

---

### 2.10 DEPLOYMENT READINESS

- **Env vars:** Not documented in repo. Need: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, optional `SENDGRID_API_KEY`/`RESEND_API_KEY`.
- **Build:** Run `pnpm build` to confirm.
- **Migrations:** Supabase migrations in repo; apply via Supabase CLI or dashboard.
- **CI/CD:** No pipeline referenced.
- **Monitoring / logging:** No Sentry or structured logging.
- **Error tracking:** None.

---

## 3. Prioritized Action Items

### P0 – Critical
- [ ] Implement authentication (Supabase Auth: email/password or magic link).
- [ ] Add RBAC (resolve role from profile/JWT; restrict routes and API by role).
- [ ] Protect routes: require auth for `/recipe-calculator`, `/kitchen`, and all `/admin/*`.
- [ ] Fix tablet spacing in recipe calculator (replace `md:mb-8!` with valid spacing; ensure gap between stacked panels).
- [ ] Confirm `order_items.recipe_id` in DB and that every order create sends `recipeId` for inventory.
- [ ] Set initial inventory stock (seed or admin UI) so ingredients are not all 0.

### P1 – Important
- [ ] Admin dashboard at `/admin/dashboard` (or `/admin`) with KPIs and links.
- [ ] Sales reports UI using `/api/reports/sales/daily` and monthly.
- [ ] Inventory management UI (list, adjust, reorder level, low-stock alerts).
- [ ] Order management UI (list, filter, detail, receipt).
- [ ] User management UI (CRUD profiles, assign roles).
- [ ] Receipt printing and email from UI.
- [ ] Kitchen: optional Supabase Realtime; link from Navbar.
- [ ] Fix recipe ingredient IDs in DB (UUIDs everywhere).

### P2 – Nice to Have
- [ ] Customer accounts and order history.
- [ ] Loyalty program, discounts, promotions.
- [ ] Barcode scanning, multiple payment methods, tax configuration.
- [ ] Export (CSV/PDF), email notifications, shift management.
- [ ] Audit logs, backup/restore, dark mode, i18n, offline sync.

---

## 4. Implementation Plan (High Level)

| Phase | Steps | Effort (rough) |
|-------|--------|------------------|
| **1. Auth & protection** | Supabase Auth (sign up, sign in, session); middleware or layout to protect `/recipe-calculator`, `/kitchen`, `/admin`; optional profile sync with role. | 1–2 days |
| **2. Tablet + data** | Fix RecipeCalculator panel spacing; verify order_items.recipe_id and front-end; set initial stock (SQL or seed). | 0.5 day |
| **3. Admin shell** | Layout for `/admin` with nav; dashboard page with placeholders and links to reports, inventory, orders, users, settings. | 1 day |
| **4. Core admin** | Inventory UI (list, adjust, alerts); Reports UI (daily/monthly); Order list/detail; wire homepage Resumen to DB. | 2–3 days |
| **5. Users & polish** | User management CRUD; receipt actions from order detail; optional Realtime for kitchen. | 1–2 days |

---

## 5. Database Schema Updates

### 5.1 Already in migrations (no change needed)
- `order_items.recipe_id` (UUID, nullable) – migration `20250130000007_order_items_recipe_id.sql`.
- `ingredients`: current_stock, price_per_unit, reorder_level.
- `inventory_transactions`: quantity, type, reference_id.
- `production_batches`: batch_count, produced_at.
- `profiles`: role (admin, manager, staff, viewer).

### 5.2 Optional: link profiles to Supabase Auth
```sql
-- If using Supabase Auth, add and backfill user_id
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
```

### 5.3 Set initial stock (example)
```sql
-- Example: set initial stock and reorder levels (adjust ids and values)
UPDATE ingredients SET current_stock = 10, reorder_level = 2 WHERE name ILIKE 'harina';
UPDATE ingredients SET current_stock = 5, reorder_level = 1 WHERE name ILIKE 'azúcar';
-- Repeat for other ingredients.
```

### 5.4 Recipe ingredients: numeric → UUID
If recipes still have numeric ingredient IDs, run the mapping script from `scripts/setup-production-db.js` (Step 3) and apply the generated UPDATE so `recipes.ingredients[].ingredientId` are UUIDs.

---

## 6. Code Examples for Key Fixes

### 6.1 Tablet spacing (RecipeCalculator)
**Current (broken):**
```tsx
<div className={`... mb-6 md:mb-8! lg:mb-0`}>
```
**Fix:**
```tsx
<div className={`... mb-6 md:mb-8 lg:mb-0`}>
```
And ensure parent keeps vertical gap when stacked:
```tsx
<div className="lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-10 space-y-6 md:space-y-8 lg:space-y-0">
```

### 6.2 Protect a route with Supabase Auth (example)
```tsx
// app/recipe-calculator/page.tsx or layout
import { createServerClient } from '@supabase/ssr';

export default async function RecipeCalculatorLayout({ children }) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (name) => cookies().get(name)?.value },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  return <>{children}</>;
}
```

### 6.3 Daily Resumen from DB instead of localStorage
In homepage, replace `getDailySalesSummary()` with a fetch to the API:
```ts
const [summary, setSummary] = useState({ orderCount: 0, totalSales: 0, averageTicket: 0 });
useEffect(() => {
  fetch(`/api/reports/sales/daily?date=${new Date().toISOString().slice(0, 10)}`)
    .then(r => r.json())
    .then(data => setSummary({
      orderCount: data.orderCount ?? 0,
      totalSales: data.totalSales ?? 0,
      averageTicket: data.averageTicket ?? 0,
    }))
    .catch(() => {});
}, []);
```
Then pass `summary` into `DailySalesSummaryModal` instead of `getDailySalesSummary()`.

---

## 7. Architecture Recommendations

- **Auth:** Use Supabase Auth and, if needed, sync to `profiles` (with `user_id`) so RBAC is based on a single source of truth.
- **Admin:** Single `/admin` layout with sidebar; all admin pages under `/admin/*`. Middleware or layout checks role (e.g. admin, manager) for write actions.
- **API:** For protected APIs, resolve user from Supabase session (or JWT), load role from `profiles`, and return 401/403 when unauthorized.
- **Data:** Prefer DB over localStorage for orders and sales; use localStorage only for draft cart or offline resilience later.
- **Kitchen:** Add Supabase Realtime subscription on `orders` (e.g. status in ['paid','preparing']) to avoid polling.

---

## 8. Timeline Estimate

| Phase | Description | Estimate |
|-------|-------------|----------|
| P0 | Auth + RBAC + protected routes + tablet fix + recipe_id/stock | 2–3 days |
| P1 | Admin shell + dashboard + inventory + reports + orders + users + Resumen from DB | 4–5 days |
| P2 | Receipt UX, kitchen Realtime, recipe ID cleanup | 1–2 days |
| **Total to “production-ready” (P0 + P1)** | | **~6–8 days** |

---

## 9. Additional Verification Checklist

- [ ] Stripe: create-intent and webhook used; test with Stripe CLI.
- [ ] Supabase: `SUPABASE_SERVICE_ROLE_KEY` and URL in `.env.local`; RLS and migrations applied.
- [ ] Recipe images: Upload to S3 works (env: AWS_*, bucket, region).
- [ ] Order numbers: RPC `generate_order_number` exists (migration `20250130000006_order_number_seq.sql`); fallback in create route.
- [ ] Kitchen: GET kitchen orders and PUT status return correct data; UI updates after 10s or after Realtime.
- [ ] Inventory: Complete an order with recipe_id and confirm stock decrement and inventory_transactions row.
- [ ] Production: Record a batch and confirm production_batches insert and ingredient decrement.
- [ ] Reports: `/api/reports/sales/daily` and monthly return expected aggregates.
- [ ] Postman/curl: Hit all API endpoints; confirm 401/403 after adding auth where applicable.
- [ ] Browser console: No errors on main flows.
- [ ] Mobile: Test menu, cart, and calculator on real devices.

---

*End of audit report.*
