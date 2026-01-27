# Funny Rolls — Codebase Audit Report

**Date:** January 26, 2025  
**Scope:** Full repository (frontend, backend, configs, lib, components)  
**No code was modified.**

---

## 1. Application Overview

### Purpose and Target Users

- **Purpose:** Web app for a cinnamon-roll bakery (“Funny Rolls”): marketing site, e‑commerce-style menu/cart, and an internal **recipe cost calculator** for production and profitability.
- **Target users:**
  - **Customers:** Browse menu, add to cart, contact via WhatsApp, place orders.
  - **Staff/owners:** Manage recipes, ingredients, tools, inventory, production tracking, and costs.

### Core Business Logic and User Flows

1. **Landing / e‑commerce**
   - Hero → Menu (products from `lib/data` + Supabase `recipes`) → About → Contact (WhatsApp form).
   - Cart: add/remove/update quantity; total computed client-side. “Pagar” exists but has **no handler** (non-functional).
   - No real payments; checkout is intended via WhatsApp.

2. **Recipe calculator** (`/recipe-calculator`)
   - **Ingredients:** CRUD, Supabase sync, inventory, cost-per-unit.
   - **Tools:** CRUD, amortization (batch cost), category configs.
   - **Recipes:** Select/edit, batch size, selling price, margin slider, steps (flip card), print.
   - **Production:** Record batches, deduct inventory, mock production history; optional status per unit (good/sold/bad/etc.).
   - **Persistence:** `localStorage` for calculator state; Supabase for recipes and ingredients.

3. **Upload / storage**
   - Recipe images: client → `/api/upload` (Next.js Route Handler) → AWS S3. Optional delete via same API.

### Key Features and Responsibilities by Module

| Module | Responsibilities |
|--------|------------------|
| `app/page.tsx` | Home: cart state, Supabase recipes fetch, layout (Hero, Menu, About, Contact, Footer, CartModal). |
| `app/recipe-calculator/page.tsx` | Calculator route; Navbar + `RecipeCalculator`; cart stub (empty). |
| `components/sections/*` | Hero, Navbar, MenuSection, About, Contact, Footer, CartModal, RecipeCalculator wrapper. |
| `components/RecipeCalculator/*` | Calculator UI: ingredients, tools, recipes, flip card, production tracker, modals, print. |
| `lib/utils.ts` | Recipe/tool cost math, storage helpers, import/export. |
| `lib/recipe-scaling.ts` | Scale recipe, unit conversion, inventory checks. |
| `lib/unit-conversion.ts` | Unit conversion, density, standard units, display formatting. |
| `lib/data.ts` | Default ingredients, tools, products (with embedded recipes). |
| `lib/mock-data.ts` | Mock production records. |
| `lib/supabase.ts` | Supabase client (anon key). |
| `lib/aws-s3.ts` | Client helpers: upload/delete via `/api/upload`, image validation. |
| `app/api/upload/route.ts` | POST: S3 upload; DELETE: S3 delete by URL. |

---

## 2. Technology & Stack Breakdown

### Languages, Frameworks, Libraries

- **Runtime:** Node.js (Next.js server) + browser.
- **Language:** TypeScript (strict).
- **Framework:** Next.js 15 (App Router), React 19.
- **Styling:** Tailwind CSS 4, `tw-animate-css`, `globals.css` with `@theme` (no `tailwind.config.js`).
- **UI:** Radix Slot, CVA, `clsx`, `tailwind-merge`; Lucide icons; `react-hot-toast`; `react-to-print`.
- **Data / storage:** Supabase (client), AWS S3 via API route, `localStorage`.
- **AWS:** `@aws-sdk/client-s3` (v3); **`aws-sdk` v2 also in dependencies but unused** — dead weight.

### Frontend / Backend / Infra

- **Frontend:** React SPA-like pages; most logic client-side (“use client”).
- **Backend:** Next.js API route `app/api/upload/route.ts` only (S3 upload/delete).
- **Infra:** No Docker, K8s, or IaC in repo. README suggests Vercel; `next.config` supports S3/Supabase image domains.

### Build and Runtime

- **Build:** `next build`; dev with Turbopack (`next dev --turbopack -p 2000`).
- **Bundler:** Next.js (Webpack in config for `fs`/`stream`/`buffer` fallbacks on client).
- **Hosting:** Implied Vercel; env-based (Supabase, AWS).

---

## 3. Architecture Analysis

### Architecture Style

- **De facto:** **Modular UI + shared lib** — feature-based components, shared `lib` for domain and IO.
- **No clear layering:** API route, Supabase, and utils are used directly from UI. No dedicated service/repository layer.

### Component / Module Relationships

- **Pages** compose **sections** and **RecipeCalculator** subcomponents.
- **RecipeCalculator** holds most state (ingredients, tools, recipes, inventory, production, modals) and passes handlers down.
- **IngredientsPanel** and **ToolsPanel** own local UI state; **RecipeCalculatorPanel** handles recipe UX, margin slider, and cost display.
- **FlipCard** uses `products` from `lib/data` for images by recipe name; **database recipes** use `recipe.image` only in modals, not in FlipCard, so **DB-only recipes show “Sin imagen”** in the calculator.

### Data Flow and State Management

- **Cart:** React state in `app/page.tsx`; not persisted.
- **Calculator:** React state + `localStorage` sync (effects) + Supabase for recipes/ingredients.
- **No global store:** No Redux, Zustand, or Context for app state.

### Client/Server Boundaries

- **Server:** Upload API only; S3 and Supabase called from server in that route.
- **Client:** Supabase client, fetch to `/api/upload`, `localStorage`, all business logic.

### Runtime vs Build-Time

- **Build:** Next.js SSG/SSR where applicable; most pages are client-rendered.
- **Runtime:** Supabase and upload API called at runtime; no ISR or static API.

---

## 4. Code Quality & Design Review

### Anti-Patterns and Code Smells

- **God component:** `RecipeCalculator` and `RecipeCalculatorPanel` hold too much state and logic.
- **Prop drilling:** Many props (e.g. `saveIngredientToSupabase`, `updateInventory`) passed through multiple layers.
- **Mixed concerns:** UI, persistence, and domain logic intertwined (e.g. Supabase + localStorage in same flow).
- **Duplicate unit logic:** `UNIT_CONVERSIONS` / `UnitConversion` in `lib/types.ts` vs `lib/unit-conversion.ts` (different shapes); `lib/types` usage appears redundant.

### Tight Coupling / Low Cohesion

- **Calculator ↔ Supabase + localStorage:** Hard dependency on both; no abstraction.
- **FlipCard ↔ `products`:** Uses `products.find(p => p.name === selectedRecipe.name)`; ignores `recipe.image` for DB recipes.
- **Cost helpers ↔ `products` / `defaultIngredients`:** `getAllRecipes`, `findProductByRecipeName`, `getIngredientById` in `utils` depend on `lib/data`; harder to test or swap data sources.

### SOLID / Clean Architecture

- **SRP:** Violated in large components (e.g. `RecipeCalculator`, `IngredientsPanel`).
- **OCP:** Adding a new backend (e.g. another DB) would require scattered changes.
- **DIP:** High-level modules depend on concrete Supabase/localStorage implementations.

### Reusability and Abstraction Gaps

- **Storage:** No generic storage interface; `localStorage` and Supabase used directly.
- **Cost engine:** Logic in `utils` is reusable but tied to current types and data sources.
- **Forms:** Little shared form/validation layer; validation ad hoc across components.

---

## 5. Security & Stability Audit

### XSS, Injection, Unsafe DOM

- **No `dangerouslySetInnerHTML`**, `innerHTML`, `eval`, or `document.write` found.  
- **Contact form:** Values interpolated into WhatsApp URL (`encodeURIComponent`); low risk if consumed only by WhatsApp.

### Auth / Session / Tokens

- **No auth implemented.** Supabase anon key and upload API are unauthenticated.
- **Implications:** Anyone can read/write Supabase (subject to RLS) and call upload/delete API.

### Environment Variables and Secrets

- **Upload API:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` (server-only; not `NEXT_PUBLIC_`).  
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-exposed; standard for Supabase client).  
- **`.env*` gitignored.** No secrets in repo.  
- **Risk:** If RLS or API auth is missing, credentials’ scope is effectively public.

### Upload API

- **POST:** No server-side file type/size checks. Validation is client-only (`validateImageFile` in `lib/aws-s3`).  
  **Impact:** Malicious clients can upload arbitrary files to S3.
- **DELETE:** Accepts `{ url }` and deletes from configured bucket. No auth or origin checks.  
  **Impact:** Anyone who can call the API can delete objects if they know URLs.

### Error Handling and Crash Risks

- **Supabase:** Many `if (error) throw error` or `throw` in handlers; errors often only logged or shown in local state. No global error boundary.
- **Upload:** Try/catch returns 500 with generic “Upload failed”; logs `console.error`.
- **`loadFromLocalStorage` / `safeGetLocalStorage`:** `JSON.parse` can throw; `safeGetLocalStorage` catches and returns fallback, but `loadFromLocalStorage` in `utils` does not mirror that safety.
- **`handleRecipeDeleted`:** Uses `recipes` and `recipes[0]` after `setRecipes`; can use stale state and wrong index.

### Memory / Resource Leaks

- **`RecipeCalculatorPanel` slider:** `useEffect` cleanup passes new arrow functions to `removeEventListener`, so it **does not remove the actual listeners** that were added.  
  **Impact:** Listeners can accumulate on repeated mount/unmount.
- **General:** No obvious long-lived timers or subscriptions that would leak across navigations.

---

## 6. Performance & Scalability

### Rendering / Execution

- **Large lists:** Ingredients, tools, production history rendered without virtualization; long lists could impact scroll/layout.
- **Cost recalc:** `costPerItem`, `totalRecipeCost`, etc. recomputed on every render; no memoization.
- **`generateMockProductionData`:** Runs on every calculator load; creates many records.

### Bundle / Load

- **`aws-sdk` v2** kept in deps but unused; increases install size and potential vulnerability surface.
- **Webpack fallbacks:** `stream-browserify`, `buffer` for client; some server packages externalized.

### Caching

- **No HTTP caching** or cache headers configured for API or static assets in repo.
- **Supabase:** No explicit caching; each mount refetches recipes/ingredients.

### Scalability (CPU / Memory / I/O)

- **Upload API:** Single route; no rate limiting or queue; large uploads block the handler.
- **Supabase/localStorage:** Acceptable for single-bakery scale; no sharding or multi-tenant design.

### Concurrency / Async

- **`loadDatabaseRecipes` + `loadIngredientsFromSupabase`:** Both run in `useEffect` on mount; no coordination.  
- **`loadIngredientsFromSupabase`** overwrites `ingredients` from Supabase + “local-only” list; race conditions possible if multiple loads in flight.

---

## 7. SEO & Production Readiness

### SEO

- **Root layout:** `metadata` (title, description, icons, manifest) set; `lang="en"` (content is Spanish).
- **Static metadata only;** no dynamic OG or per-page meta.
- **Semantic structure:** Sections use `<section>`, headings; no schema.org or structured data.

### Accessibility

- **MobileViewSwitcher:** Uses `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label`, keyboard handling.
- **Modal focus:** No visible focus trap or `aria-modal` usage in custom modals.
- **CartModal:** No `role="dialog"` or `aria-labelledby`.
- **Form labels:** Present; occasional `id`/`htmlFor` mismatch risk (not fully audited).
- **Contrast:** Custom colors (e.g. amber) used; not verified against WCAG.

### Production Config

- **`next.config`:** Image domains for S3 and Supabase; `serverExternalPackages` for S3.
- **No explicit security headers,** CORS, or rate limiting.
- **Logs:** `console.log`/`console.error` in upload route and other logic; should be removed or routed to a logger in production.

---

## 8. Maintainability & DX

### Structure

- **`components/sections`** vs **`components/RecipeCalculator`:** Clear split between marketing and calculator.
- **`lib`** holds types, data, and domain helpers; **no `hooks`** directory despite `components.json` alias.

### Naming

- **Inconsistent:** “Receta” vs “Recipe”; mix of Spanish and English in code.
- **Typos:** e.g. `EditableToolRow` option `"herramientaio"` instead of `"herramienta"`.

### Documentation

- **README:** High-level setup, tech stack, features; no API or architecture docs.
- **Comments:** Sparse; some “FIX”/“ADD THIS” style comments left in code.

### Testing

- **No tests.** No Jest, Vitest, React Testing Library, or E2E setup.
- **`coverage`** gitignored; no CI running tests.

### CI/CD

- **No pipelines.** No GitHub Actions, Circle CI, or similar.
- **Deploy:** Presumably manual (e.g. Vercel); no automated build/test/lint gates.

---

## 9. Explicit Issue List

**Ordered by severity: Critical → High → Medium → Low.**

| # | Severity | Description | Impact | Location |
|---|----------|-------------|--------|----------|
| 1 | **Critical** | Upload API has no server-side file type/size validation. | Arbitrary files can be uploaded to S3. | `app/api/upload/route.ts` (POST) |
| 2 | **Critical** | Upload DELETE accepts any URL; no auth. | Anyone can delete S3 objects for known URLs. | `app/api/upload/route.ts` (DELETE) |
| 3 | **Critical** | `getIngredientCostPerUnit` uses `UnitConverter.convertToStandardUnit(1, unit)` without `containsAmount`/`containsUnit`. | Wrong cost for custom package units (e.g. paquete ≠ 250g). | `lib/utils.ts` `getIngredientCostPerUnit` |
| 4 | **High** | `updateRecipeSellingPrice` calls `calculateProfitPercentage` without `tools`. | Margin slider shows incorrect profit % when recipe uses tools. | `components/RecipeCalculator/RecipeCalculatorPanel.tsx` ~230–237 |
| 5 | **High** | `PrintableRecipe` uses `calculateCostPerItem` / `calculateRecipeCost` / `calculateProfitPercentage` without `tools`. | Printed recipe ignores tool costs. | `components/RecipeCalculator/PrintableRecipe.tsx` ~21–24 |
| 6 | **High** | Slider `useEffect` cleanup passes new functions to `removeEventListener`. | Listeners never removed; accumulation on re-mount. | `components/RecipeCalculator/RecipeCalculatorPanel.tsx` ~125–133 |
| 7 | **High** | `handleRecipeDeleted` uses `recipes` and `recipes[0]` after `setRecipes` (stale state). | Wrong recipe selected or index error after delete. | `components/RecipeCalculator/RecipeCalculator.tsx` ~134–145 |
| 8 | **High** | FlipCard resolves image via `products.find(p => p.name === selectedRecipe.name)`; ignores `recipe.image`. | DB-only recipes always “Sin imagen” in calculator. | `components/RecipeCalculator/FlipCard.tsx` ~45–46, 96–108 |
| 9 | **Medium** | Cart “Pagar” button has no `onClick` handler. | Checkout flow is non-functional. | `components/sections/CartModal.tsx` ~49 |
| 10 | **Medium** | Off-home nav uses `router.push(\`/${hash}\`)` (e.g. `/#home`); no scroll-to-section on load. | From e.g. `/recipe-calculator`, “Inicio” etc. don’t scroll to section. | `components/sections/Navbar.tsx` ~22–32 |
| 11 | **Medium** | `CustomNumberInput` syncs `displayValue` from `value`; `value === 0` → `''`. | Typing “0” can immediately clear to placeholder. | `components/RecipeCalculator/CustomNumberInput.tsx` ~266–268, initial state |
| 12 | **Medium** | `loadIngredientsFromSupabase` overwrites `ingredients`; runs with `loadDatabaseRecipes` in parallel. | Possible races and briefly inconsistent state. | `components/RecipeCalculator/RecipeCalculator.tsx` ~318–364, useEffects |
| 13 | **Medium** | `UnitConverter.convertToStandardUnit` not called with `containsAmount`/`containsUnit` in display label. | “Costo por X” label can use wrong unit for custom packages. | `components/RecipeCalculator/IngredientsPanel.tsx` ~611–613 |
| 14 | **Medium** | Duplicate `UNIT_CONVERSIONS` / `UnitConversion` in `types.ts` vs `unit-conversion.ts`. | Confusion and drift. | `lib/types.ts` vs `lib/unit-conversion.ts` |
| 15 | **Low** | `aws-sdk` v2 in dependencies but unused. | Extra install size and surface. | `package.json` |
| 16 | **Low** | EditableToolRow option typo: “herramientaio”. | UI typo. | `components/RecipeCalculator/EditableToolRow.tsx` ~46 |
| 17 | **Low** | Tool `newTool` state includes `cost`; `Tool` type has no `cost`. | Redundant/unused field. | `components/RecipeCalculator/ToolsPanel.tsx` ~26–42 |
| 18 | **Low** | `console.log` left in upload route and elsewhere. | Noisy logs in production. | `app/api/upload/route.ts` ~47; `IngredientsPanel` ~624 |
| 19 | **Low** | `html` `lang="en"` while content is primarily Spanish. | Inaccurate language hint for SEO/a11y. | `app/layout.tsx` ~39 |
| 20 | **Low** | `lib/data` ingredient “Leche” uses unit `litro`; `UNIT_CATEGORIES` uses `l`. | Potential conversion gaps. | `lib/data.ts`; `lib/unit-conversion.ts` |
| 21 | **Low** | `defaultTools` use categories like `electrodomestico`, `medicion`; `TOOL_CATEGORY_CONFIGS` uses `measuring`, `mixing`, etc. | Unmatched categories fall back to `general`; amortization may not match intent. | `lib/data.ts`; `lib/types.ts` |

---

## 10. Next Steps & Recommendations

### Immediate Fixes (No Redesign)

1. **Upload API:** Add server-side validation (type allowlist, max size, magic bytes) and reject invalid requests.
2. **Upload DELETE:** Require auth or at least a shared secret; validate URL against allowed bucket/prefix.
3. **`getIngredientCostPerUnit`:** Pass `ingredient.containsAmount` and `ingredient.containsUnit` into `UnitConverter.convertToStandardUnit` when present.
4. **`updateRecipeSellingPrice`:** Pass `tools` into `calculateProfitPercentage`.
5. **`PrintableRecipe`:** Pass `tools` into cost/profit helpers (or accept tools as prop and use them).
6. **Slider cleanup:** Store `handleMove`, `onStop` in refs and remove those same references in `removeEventListener`.
7. **`handleRecipeDeleted`:** Use functional updates and derive “next selected” from the updated list (e.g. `setRecipes(prev => { ... })` and select from `prev`).
8. **FlipCard:** Prefer `selectedRecipe.image` when present; fall back to `product?.image` by name.
9. **Cart “Pagar”:** Add handler (e.g. WhatsApp prefill with cart summary) or hide until implemented.
10. **Navbar off-home nav:** After `router.push(\`/\${hash}\`)`, trigger scroll-to-section (e.g. `router.events` or `useEffect` on target page reading `window.location.hash`).

### Short-Term Improvements

- **Error boundaries:** Add React error boundaries around major sections and log to a service.
- **Centralize Supabase/localStorage access** behind small modules or hooks to avoid duplication and races.
- **Memoize cost calculations** (e.g. `useMemo`) where dependencies are clear.
- **Remove `aws-sdk` v2** and rely only on `@aws-sdk/client-s3`.
- **Fix `CustomNumberInput`** so `value === 0` is displayed consistently (e.g. keep `'0'` in `displayValue`).
- **Add `role="dialog"` and focus trap** to CartModal and other modals.
- **Set `lang="es"`** (or per-page) where content is Spanish.

### Long-Term Architectural Improvements

- **Introduce a service/repository layer** for Supabase and storage; keep UI free of direct Supabase/localStorage calls.
- **Split RecipeCalculator** into smaller feature components or hooks (e.g. ingredients, tools, production).
- **Add state management** (Context, Zustand, or similar) for calculator (and optionally cart) to reduce prop drilling.
- **Unify unit conversion** in one module; remove duplicates from `types.ts`.
- **Add E2E tests** for critical flows (add to cart, calculator cost, upload).
- **CI pipeline:** Lint, typecheck, test, and build on push/PR.

### Suggested Features (Aligned with Current App)

- **WhatsApp checkout:** “Pagar” opens WhatsApp with cart summary and optional customer info.
- **Recipe calculator permalinks:** Encode selected recipe (and maybe batch size) in URL for sharing.
- **Offline-friendly calculator:** Service worker + IndexedDB for localStorage backup.
- **Basic auth for calculator:** Protect `/recipe-calculator` and upload API (e.g. Supabase Auth or simple PIN).

---

**End of audit.**
