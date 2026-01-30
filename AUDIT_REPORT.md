# Funny Rolls — Codebase Audit Report

**Date:** January 29, 2025  
**Scope:** Full repository (frontend, backend, config, lib)  
**Rules:** Technology-agnostic, no code changes, conclusions based only on existing code.

---

## 1. Application Overview

### Purpose and Target Users

**Funny Rolls** is a web application for a cinnamon-roll bakery. It serves:

1. **Customers** — Landing site, product menu, cart, contact via WhatsApp.
2. **Operators / bakery staff** — Recipe cost calculator, ingredient/tool management, production tracking, export/import of recipe data.

Product focus: presentation (hero, menu, about, contact) and an internal “calculadora de costos” for recipes, ingredients, tools, and production.

### Core Business Logic and User Flows

- **Landing:** Browse menu → add to cart → open cart → (intended) pay / checkout. Contact form submits to WhatsApp with name, phone, message.
- **Calculator:** Manage ingredients and tools (local + Supabase), manage recipes (local + Supabase), select recipe → adjust batch size / selling price → see cost, profit, margin. Record production (batch count, date) and track inventory. Export/import JSON. Print recipe. Recipe images uploaded to S3 via `/api/upload`.
- **Data sources:** Static products/ingredients/tools in `lib/data`, Supabase (`recipes`, `ingredients`, `tools`), `localStorage` (calculator state), S3 (recipe images).

### Key Features and Responsibilities by Module

| Module | Responsibility |
|--------|----------------|
| **`app/page`** | Home: cart state, fetches DB recipes, combines with static products, renders Hero, Menu, About, Contact, CartModal. |
| **`app/recipe-calculator`** | Calculator page: Navbar + RecipeCalculator. |
| **`app/api/upload`** | POST: validate FormData file → upload to S3 → return URL. DELETE: parse JSON `url` → delete object from S3. |
| **`components/sections/*`** | Hero, Navbar, MenuSection, About, Contact, Footer, CartModal, RecipeCalculator (wrapper). |
| **`components/RecipeCalculator/*`** | Calculator UI: ingredients panel, tools panel, recipe panel (flip cards, sliders, modals), production tracker, recipe manager modal, printable recipe. |
| **`lib/data`** | Static `products`, `defaultIngredients`, `defaultTools`, `toolCategories`. |
| **`lib/utils`** | Cost calculations (recipe, cost-per-item, profit, margin), tool amortization, storage helpers, export/import. |
| **`lib/recipe-scaling`** | Scale recipe by batch size, unit conversion, inventory checks. |
| **`lib/unit-conversion`** | Unit conversions, density-based weight/volume, “standard unit” helpers. |
| **`lib/aws-s3`** | Client-side wrappers: upload via `/api/upload`, delete via same route, image validation. |
| **`lib/supabase`** | Supabase client (anon key) for `recipes`, `ingredients`, `tools`. |

---

## 2. Technology & Stack Breakdown

### Languages, Frameworks, Libraries

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js (Next.js server), browser |
| **Language** | TypeScript (strict) |
| **Framework** | Next.js 15 (App Router), React 19 |
| **Styling** | Tailwind CSS 4, tw-animate-css, PostCSS |
| **UI** | Radix (Slot), CVA, clsx, tailwind-merge, Lucide, react-hot-toast, react-to-print |
| **Data / Backend** | Supabase (JS client), AWS S3 via `@aws-sdk/client-s3` |
| **Bundler / build** | Next.js (Webpack); dev uses Turbopack |

### Frontend / Backend / Infra

- **Frontend:** Client components (`"use client"`) for main pages and most UI. Server components only implicitly via layout.
- **Backend:** Next.js API route `app/api/upload/route.ts` (S3 upload/delete). Supabase used from client and could be used from server; currently all Supabase access is client-side.
- **Infra:** No IaC in repo. README suggests Vercel; `.gitignore` includes `.vercel`. Next config allows images from S3 and Supabase storage domains.

### Build and Runtime

- **Build:** `next build`. Dev: `next dev --turbopack -p 2000`.
- **Config:** `next.config` customizes webpack (e.g. `stream`/`buffer` fallbacks for client), `serverExternalPackages: ['@aws-sdk/client-s3']`, image `remotePatterns` for S3 and Supabase.
- **Env:** AWS credentials and bucket via `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`; Supabase via `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. All `.env*` ignored.

---

## 3. Architecture Analysis

### Overall Style

- **Layout:** App Router (root layout + pages). Feature-based split: sections (marketing), RecipeCalculator (app-like sub-feature).
- **State:** React state in pages/panels; no global store. `localStorage` for calculator persistence. Supabase for remote CRUD.
- **Data flow:** Top-down props (e.g. cart, recipes, ingredients, tools). Callbacks for updates. Some duplication (e.g. tools in IngredientsPanel vs parent).
- **Server/client boundary:** API route for upload/delete only. All Supabase and app logic run on client.

### Component and Module Relationships

- **Pages** compose sections and pass cart/open handlers. Calculator page composes `RecipeCalculator` and `Navbar`.
- **RecipeCalculator** holds ingredients, tools, recipes, inventory, production history, DB recipe list. Loads/saves localStorage and Supabase, owns modals and panels.
- **IngredientsPanel** owns ingredient CRUD and tool list UI; uses local `tools` state from `defaultTools`, not parent `tools`.
- **RecipeCalculatorPanel** uses parent `ingredients` and `tools`, implements recipe selection, batch/price edits, production recording, export/import, print.
- **RecipeManagerModal** implements add/edit recipe (local or DB), image upload/delete via S3, Supabase upsert for recipes.

### Runtime vs Build-Time

- **Build:** Next.js bundles client and server. Tailwind/PostCSS process CSS. No separate backend build.
- **Runtime:** Next server serves app and API. Client hydrates, fetches Supabase, reads/writes localStorage, calls `/api/upload` for images.

---

## 4. Code Quality & Design Review

### Anti-patterns and Code Smells

- **God component:** `RecipeCalculator` and `RecipeCalculatorPanel` host a large share of state and logic; many responsibilities in single components.
- **Duplicated state:** Tools live in parent (RecipeCalculator) and again in IngredientsPanel (`useState(defaultTools)`). Edits in ToolsPanel affect only IngredientsPanel’s copy; calculator uses parent’s tools. Same tool list represented in two disconnected sources.
- **Mixed concerns:** RecipeCalculator handles Supabase, localStorage, validation, and UI orchestration; no clear service layer.
- **Debug/UX remnants:** `handleImportData` uses `alert(\`...here is your ${data}\`)` with raw import result. `console.log` in production paths (e.g. upload route, mock-data, inventory updates).
- **Magic values:** Hardcoded IDs (e.g. `recipe-${Date.now()}`), phone numbers, bucket names, numeric limits scattered in components.

### Coupling and Cohesion

- **Tight coupling:** Calculator panels depend directly on `lib/data`, `lib/utils`, Supabase client, and types. Utils import `products` and `defaultIngredients`; mutation helpers like `updateRecipeInProducts` change shared data.
- **Low cohesion:** `lib/utils` mixes styling (`cn`), cost math, tool setup, storage, and export/import. `lib/unit-conversion` holds both generic conversion and ingredient-specific concepts (e.g. `getCostPerStandardUnit`).

### SOLID / Clean Architecture

- **SRP:** Violated in RecipeCalculator, RecipeCalculatorPanel, and `lib/utils` (many responsibilities each).
- **OCP:** New recipe sources or storage backends would require editing existing components and utils.
- **DIP:** Components and utils depend on concrete Supabase client, S3 helpers, and static data rather than abstractions.

### Reusability and Abstraction

- **Reuse:** Little shared abstraction for “recipe source” or “ingredient/tool store.” Export/import and localStorage keys are ad hoc.
- **Types:** Shared interfaces in `lib/types` help, but `ProductionItem` / `ProductionStatus` are redefined in `ProductionTrackerPanel` instead of importing from types.

---

## 5. Security & Stability Audit

### XSS, Injection, Unsafe DOM

- **No `dangerouslySetInnerHTML` or `eval`** found. User-generated content in WhatsApp message is interpolated into a string and then `encodeURIComponent`’d for the URL; opening in WhatsApp limits XSS impact. No raw HTML from user input in-app.

### Auth / Session / Tokens

- **No auth implementation.** Supabase uses anon key only. Upload API has no auth; any client can POST files or call DELETE with a URL. RLS (if any) is not visible in repo; tables are assumed to be protected by Supabase project policies, not app-level checks.

### Environment and Secrets

- **Env usage:** AWS and Supabase config from `process.env`. `.env*` gitignored. Non-deterministic fallbacks (e.g. `AWS_REGION`, `AWS_S3_BUCKET`) when vars missing; upload/delete may run against wrong region/bucket in misconfiguration.
- **Exposure:** `NEXT_PUBLIC_*` vars are bundled to client; appropriate for Supabase URL/anon key. AWS secrets used only in API route (server-side).

### Dependency Risks

- **Dual AWS SDKs:** Both `aws-sdk` (v2) and `@aws-sdk/client-s3` (v3) in `package.json`. Only v3 used in API route; v2 is unused and adds surface and bundle weight.
- **Vulnerabilities:** Not scanned here; recommend `npm audit` and regular updates.

### Error Handling and Crash Risks

- **API route:** Upload/delete catch errors, return 500 with generic message, and log. No retries or structured error codes.
- **Supabase:** Many call sites check `error` and `throw` or set local error state; some only `console.error` and continue. Unhandled promise rejections possible where Supabase errors are not propagated.
- **Utils:** `loadFromLocalStorage` can throw on invalid JSON; callers use try/catch. `importRecipeData` rejects on invalid structure; `handleImportData` catches and alerts.
- **Missing ingredients:** Recipes in `lib/data` reference `ingredientId` 9–13; `defaultIngredients` has no such IDs. Lookups return `undefined`; cost math can use `undefined` and produce NaN or incorrect values if not guarded.

### Resource and Lifecycle

- **Event listeners:** In `RecipeCalculatorPanel`, `startDragging` adds `mousemove`/`mouseup`/`touchmove`/`touchend` listeners. Cleanup `useEffect` calls `removeEventListener` with *new* inline functions, so the actual handlers are never removed. Listeners accumulate on repeated use (memory leak, stale closures).
- **Blob URLs:** `exportRecipeData` creates a blob URL, triggers download, revokes URL; correctly cleaned up.

---

## 6. Performance & Scalability

### Rendering and Execution

- **Heavy panels:** `RecipeCalculatorPanel` is very large (thousands of lines) with many `useState` values and inline logic. Re-renders can be broad. No `React.memo` or granular splitting observed.
- **useEffect chains:** Multiple `useEffect`s in RecipeCalculator depend on `ingredients`, `recipes`, etc., and write to localStorage. Rapid edits can trigger many writes and re-renders.
- **Supabase + localStorage:** Initial load runs Supabase fetches and localStorage reads; DB recipes and ingredients are merged with local data. No caching layer; each calculator visit refetches.

### Bundle and Load

- **Calculator:** RecipeCalculator and allies pull in Supabase, utils, unit-conversion, recipe-scaling, and much UI. Lazy-loading or code-splitting for the calculator route not evident; calculator code likely loaded on initial app load if visited.
- **AWS SDK:** `serverExternalPackages` keeps `@aws-sdk/client-s3` out of client bundle; upload/delete run only on server.

### Caching

- **No HTTP caching** configured for API routes or static assets in repo.
- **No SWR/React Query** (or similar) for Supabase; every mount refetches.

### Scalability and Concurrency

- **Stateless API:** Upload route is stateless; horizontal scaling of the Next server is fine from an app logic perspective.
- **Supabase / S3:** Scaling depends on Supabase and S3 limits and configuration, not shown in repo.
- **localStorage:** Single-tab, single-origin; no cross-tab sync. High variation in limits across devices; `saveToLocalStorage` can throw when full.

---

## 7. SEO & Production Readiness

### SEO

- **Metadata:** Root layout sets `title`, `description`, favicons, manifest. Good base.
- **`lang`:** Layout uses `lang="en"`; content is largely Spanish. Mismatch can affect interpretation of language.
- **Structure:** Semantic sections (e.g. `main`, headings) exist. Dynamic and client-only calculator content is less relevant for SEO.
- **Open Graph / Twitter:** No OG or Twitter meta tags found; sharing previews may be generic.

### Accessibility

- **Focus and keyboard:** Buttons and links generally focusable; custom controls (sliders, dropdowns) not fully reviewed. CustomSelect, CustomNumberInput, and similar need verification for keyboard and screen readers.
- **ARIA:** Limited use observed; modals and toggles may lack roles/labels.
- **Contrast:** Custom palette (amber, brown) used; contrast not verified against WCAG.

### Production Configuration

- **Logging:** `console.log`/`console.error` in API and client code. Should be conditional or routed via a logging abstraction in production.
- **Error messages:** API returns generic “Upload failed” / “Delete failed”; good to avoid leaking internals, but client could distinguish retriable vs permanent failures.
- **Health/readiness:** No health or readiness endpoints found.

---

## 8. Maintainability & DX

### Structure and Naming

- **Structure:** `app/`, `components/`, `lib/` separation is clear. RecipeCalculator has many components in one folder; some filenames overlap with section components (e.g. `RecipeCalculator` in both).
- **Naming:** Mixed Spanish and English (e.g. “Costo”, “Guardar” vs “production”, “ingredients”). Generally consistent within features but not global.

### Documentation and Comments

- **README:** Describes setup, scripts, and features; some project structure and config details are outdated (e.g. Tailwind config reference).
- **Comments:** Sparse; a few “FIX” or “ADD THIS” style comments. Complex logic (e.g. unit conversion, tool amortization) is under-documented.

### Testing

- **No tests** in repo. No Jest, Vitest, or React Testing Library; no CI steps for tests. `coverage` is gitignored.

### CI/CD and Deployment

- **No CI config** (e.g. GitHub Actions) in repo. Only `npm run lint` besides build/start. No automated test, audit, or deploy pipeline visible.

---

## 9. Explicit Issue List

**Order: Critical → High → Medium → Low.**  
Format: **Description** | **Impact** | **File(s) and line(s)**.

---

### Critical

| # | Description | Impact | Location |
|---|-------------|--------|----------|
| 1 | **Upload API has no authentication.** Anyone can POST arbitrary files to S3 and DELETE by URL. | Unauthorized storage use, possible abuse and cost; arbitrary deletes in your bucket. | `app/api/upload/route.ts` |
| 2 | **DELETE /api/upload** accepts any `url` in JSON, derives S3 key from path, and deletes from configured bucket. **No check that URL refers to your bucket/path.** Attacker can make you delete objects by crafting URLs. | Unauthorized deletion of S3 objects in your bucket. | `app/api/upload/route.ts` (e.g. 56–71) |
| 3 | **`getIngredientCostPerUnit`** uses `UnitConverter.convertToStandardUnit(1, ingredient.unit)` for ingredients with `containsAmount`/`containsUnit`, **without passing those fields.** Conversion falls back to default rules (e.g. docena → 12), ignoring ingredient-specific data. | Wrong cost per unit for custom packages (e.g. “sobre” with 11 g); incorrect recipe costs and margins. | `lib/utils.ts` 205–215 |
| 4 | **Recipes in `lib/data` reference `ingredientId` 9–13** (e.g. chocolate, strawberry, blueberry, caramel, cream cheese). **These IDs are not in `defaultIngredients`.** Lookups yield `undefined`; cost math can NaN or misbehave. | Broken or incorrect cost calculations for those recipes; possible runtime errors. | `lib/data.ts` (products with ingredientIds 9–13); `defaultIngredients` lacks those ids |
| 5 | **IngredientsPanel keeps its own `tools` state** from `defaultTools` and passes it to ToolsPanel. **Parent RecipeCalculator has separate `tools`** used by RecipeCalculatorPanel. Edits in ToolsPanel don’t update parent; calculator uses different tool list than the one being edited. | Tool edits in UI have no effect on recipe cost calculations; inconsistent data. | `components/RecipeCalculator/IngredientsPanel.tsx` (e.g. 51, 347–353); `RecipeCalculator.tsx` tools state |

---

### High

| # | Description | Impact | Location |
|---|-------------|--------|----------|
| 6 | **`updateRecipeSellingPrice`** calls `calculateProfitPercentage` with only `(recipe, ingredients)`, **omitting `tools`.** Margin slider and derived margin ignore tool costs. `costPerItem` elsewhere includes tools. | Margin and selling-price logic inconsistent with actual cost; misleading UX. | `components/RecipeCalculator/RecipeCalculatorPanel.tsx` (e.g. 230–242) |
| 7 | **PrintableRecipe** uses `calculateCostPerItem`, `calculateRecipeCost`, `calculateProfit`, `calculateProfitPercentage` with **only `(recipe, ingredients)`.** Tool costs excluded from printed recipe. | Printed cost/margin/profit differ from in-app values when tools are used. | `components/RecipeCalculator/PrintableRecipe.tsx` (e.g. 21–24) |
| 8 | **RecipeManagerModal `calculatePreview`** uses `ingredient?.price * recipeIng.amount` for ingredient cost. **Does not use `getIngredientCostPerUnit`;** ignores `containsAmount`/`containsUnit` and per-unit logic. | Wrong cost preview in modal for non-standard units. | `components/RecipeCalculator/RecipeManagerModal.tsx` (e.g. 390–406) |
| 9 | **ProductionTrackerPanel** defines local `ProductionItem` and `ProductionStatus` instead of importing from `lib/types`. Parent does not pass `updateProductionStatus` or `addProductionItem`. Status changes and new items **only update local state**; never persisted. | Production tracking edits lost on refresh; localStorage production history not updated. | `components/RecipeCalculator/ProductionTrackerPanel.tsx` (e.g. 20–30, 72–110); `RecipeCalculator.tsx` (panel usage) |
| 10 | **Slider `useEffect` cleanup** calls `removeEventListener` with **new inline functions**, not the ones passed to `addEventListener` in `startDragging`. The actual listeners are never removed. | Listeners accumulate; memory leak and risk of stale closures on repeated use. | `components/RecipeCalculator/RecipeCalculatorPanel.tsx` (e.g. 124–132) |
| 11 | **Supabase client** is created with `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `NEXT_PUBLIC_SUPABASE_ANON_KEY!`. If missing, client still created with `undefined`; Supabase calls can fail at runtime. | Hard-to-debug runtime failures when env is misconfigured. | `lib/supabase.ts` 3–6 |
| 12 | **CartModal “Pagar” button** has no `onClick` or other handler. It does nothing. | Checkout flow never starts; dead UX. | `components/sections/CartModal.tsx` (e.g. 49) |

---

### Medium

| # | Description | Impact | Location |
|---|-------------|--------|----------|
| 13 | **`handleImportData`** does `alert(\`Datos importados correctamente! here is your ${data}\`)` with raw import result object. | Bad UX; debug leftover; possible confusion. | `components/RecipeCalculator/RecipeCalculatorPanel.tsx` (e.g. 308–316) |
| 14 | **Contact WhatsApp SVG** uses `className="h-64 w-64"` (256px). Likely typo for `h-6 w-6`. | Oversized icon; layout/UX issue. | `components/sections/Contact.tsx` (e.g. 129) |
| 15 | **`lib/data` tool categories** use Spanish keys (e.g. `medicion`, `mezcla`); **`TOOL_CATEGORY_CONFIGS` in `lib/types`** use English (`measuring`, `mixing`). `defaultTools` use `medicion`, etc. Config lookup can miss, falling back to `general`. | Tool amortization may use wrong or default config for some tools. | `lib/types.ts` (`TOOL_CATEGORY_CONFIGS`); `lib/data.ts` (`defaultTools`, `toolCategories`) |
| 16 | **`unit-conversion`** exports `UnitConversion` and `UNIT_CONVERSIONS`; **`lib/types`** also defines `UnitConversion` and `UNIT_CONVERSIONS` with different shapes (`from`/`to`/`ratio` vs `fromUnit`/`toUnit`/`conversionFactor`). | Name collision and confusion; risk of using wrong type or constants. | `lib/unit-conversion.ts`; `lib/types.ts` |
| 17 | **`updateRecipeInProducts`** mutates shared `products` array from `lib/data`. | Imported data is mutable global state; harder to reason about and test. | `lib/utils.ts` (e.g. 228–237); `lib/data.ts` |
| 18 | **`loadIngredientsFromSupabase`** has `ingredients` in dependency array and merges Supabase + local. Calling it updates `ingredients` state, which can retrigger effect. | Risk of effect loops or redundant work depending on usage. | `components/RecipeCalculator/RecipeCalculator.tsx` (e.g. 43–88, 267–273) |
| 19 | **Mock production data** uses `Date.now()` in IDs (e.g. `prod-...-${Date.now()}`). Same if used in tests or multiple rapid calls. | Non-deterministic IDs; potential duplicates in tests or edge cases. | `lib/mock-data.ts` (e.g. 93) |
| 20 | **Upload route** logs `Upload SUCCESS:` and URL. | Logs sensitive storage URLs; noisy production logs. | `app/api/upload/route.ts` (e.g. 47) |
| 21 | **`safeGetLocalStorage`** typo: `"Failed to save data"` in catch for **load** failure. | Misleading error message. | `lib/utils.ts` (e.g. 105) |

---

### Low

| # | Description | Impact | Location |
|---|-------------|--------|----------|
| 22 | **Layout `lang="en"`** while most content is Spanish. | Minor SEO/language mismatch. | `app/layout.tsx` (e.g. 39) |
| 23 | **`globals.css`** typo `01.2rem` → likely `1.2rem`. | Wrong font size for affected class. | `app/globals.css` (e.g. 210) |
| 24 | **`aws-sdk` (v2)** in dependencies; only **`@aws-sdk/client-s3` (v3)** used. | Unused dependency; extra install and audit surface. | `package.json` |
| 25 | **README** mentions Tailwind config and structure that don’t match current layout (e.g. `tailwind.config.js`). | Outdated documentation. | `README.md` |
| 26 | **No tests, no CI.** | Regressions and refactors harder to validate. | Repo-wide |
| 27 | **Calculator `useEffect`** runs `loadDatabaseRecipes()` with empty deps on mount. Same for `loadIngredientsFromSupabase` ( via another effect). | Extra Supabase calls on every calculator mount; no caching. | `components/RecipeCalculator/RecipeCalculator.tsx` (e.g. 264–274) |

---

## 10. Next Steps & Recommendations

### Immediate Fixes (No Redesign)

1. **Upload API**
   - Add authentication/authorization (e.g. session, API key, or Supabase auth) and reject unauthenticated requests.
   - Validate that `url` in DELETE refers to your bucket and allowed prefix (e.g. `recipe-images/`) before deleting.
2. **Cost and units**
   - Pass `containsAmount` and `containsUnit` into `UnitConverter.convertToStandardUnit` in `getIngredientCostPerUnit` when present (or equivalent fix) so custom packages are correct.
   - Add missing ingredients 9–13 to `defaultIngredients` (or remove those recipe references) and add null checks wherever ingredient lookups are used in cost math.
3. **Tools state**
   - Use a single source of truth for tools: e.g. lift tools state to RecipeCalculator and pass it (and setters) into IngredientsPanel/ToolsPanel, and use that same state in RecipeCalculatorPanel.
4. **Calculator consistency**
   - Use `calculateCostPerItem` / `calculateProfitPercentage` with **tools** everywhere (RecipeCalculatorPanel slider, PrintableRecipe, RecipeManagerModal preview). Unify cost vs selling-price vs margin logic.
5. **Production tracker**
   - Import `ProductionItem` / `ProductionStatus` from `lib/types`. Implement `updateProductionStatus` and `addProductionItem` in parent, persist to production history (e.g. localStorage) and pass them into ProductionTrackerPanel.
6. **Event listeners**
   - Store references to the handlers used in `startDragging`, and remove those exact references in the `useEffect` cleanup (or use a single delegated handler) so listeners are actually removed.
7. **Cart**
   - Wire “Pagar” to real flow: e.g. redirect to WhatsApp with order summary, or a dedicated checkout page.
8. **Small fixes**
   - Fix Contact WhatsApp icon size (`h-6 w-6`). Correct `safeGetLocalStorage` error message. Remove or gate `console.log` in upload route. Fix `01.2rem` → `1.2rem` in CSS.

### Short-Term Improvements

- **Env validation:** Validate required env vars at startup (or in a shared config module) and fail fast with clear errors.
- **Supabase RLS:** Define and enforce RLS policies for `recipes`, `ingredients`, `tools`; ensure anon access is limited to what the app needs.
- **Error handling:** Centralize API and Supabase error handling; map to user-facing messages and optionally to retriable vs non-retriable.
- **Logging:** Replace ad hoc `console` with a small logging util (or env-based guard) and use it in API and critical client paths.
- **Tool category alignment:** Unify category keys between `lib/data` and `TOOL_CATEGORY_CONFIGS` (or add an explicit mapping) so amortization uses the right config.
- **Types:** Resolve `UnitConversion` / `UNIT_CONVERSIONS` duplication between `lib/types` and `lib/unit-conversion`; use a single source.
- **Import UX:** Replace `alert(\`...${data}\`)` with a proper success (and error) UI; avoid exposing raw structures.
- **Tests:** Add unit tests for `lib/utils` (cost, storage, export/import) and `lib/unit-conversion`; add a few integration tests for critical flows (e.g. upload, calculator crunch).
- **CI:** Add a pipeline (e.g. GitHub Actions) that runs lint, tests, and `npm audit`.

### Long-Term Architectural Improvements

- **Domain boundaries:** Introduce a clear “calculator” domain (recipes, ingredients, tools, production) with dedicated modules or services. Keep UI thin over these layers.
- **Data access layer:** Abstract Supabase and localStorage behind repositories or services. Use them in components via props or context instead of direct imports.
- **State management:** Consider a single store (e.g. Zustand, Reducer + context) for calculator state to avoid duplicated tools, ingredients, and recipe selection, and to simplify persistence.
- **API design:** Consider a small backend layer for upload/delete (and possibly recipe CRUD) with consistent auth, validation, and error contracts. Keep frontend free of SDK-specific details.
- **Split calculator bundle:** Lazy-load calculator route and heavy panels to improve initial load.
- **Monitoring:** Add error tracking and optional performance monitoring in production.

### Feature Enhancements (Aligned with Current App)

- **Checkout:** Complete “Pagar” flow (e.g. WhatsApp order summary, or simple checkout page).
- **Offline / sync:** Clear strategy for calculator when offline (e.g. queue Supabase updates, sync when back online).
- **Calculator UX:** Undo/redo for recipe edits; validation and warnings before overwriting localStorage or DB.
- **Production:** Persist production item status changes and new items; optionally sync to Supabase or export.
- **SEO / i18n:** Set `lang` and metadata per locale; add OG/Twitter tags; consider i18n for mixed language content.

---

**End of report.**  
All findings are based solely on the code and configuration present in the repository at the time of the audit.
