# CRUD Improvements — Funny Rolls

Improvements to create/read/update/delete flows across **Recipes**, **Ingredients** (done), **Tools**, **Inventory**, and **Production**. Ordered by impact and effort.

---

## 1. Recipes CRUD

### 1.1 Fix `handleRecipeDeleted` stale state (High)

**Issue:** Uses `recipes` and `recipes[0]` after `setRecipes`; state is stale.

**Location:** `components/RecipeCalculator/RecipeCalculator.tsx` ~135–146

**Change:** Use functional updates and derive “next selected” from the updated list:

**Current (buggy):** `setRecipes` runs, then `selectedRecipe` is updated using `recipes` (still stale) and `recipes[0]`, so you can pick the wrong recipe or hit an index error.

**Correct approach:** Compute `nextRecipes = recipes.filter(r => r.id !== recipeId)` locally, then:
1. `setRecipes(nextRecipes)`
2. If `selectedRecipe.id === recipeId`, call `setSelectedRecipe(nextRecipes[0] ?? defaultRecipe)` — use `nextRecipes`, not `recipes`, so you avoid stale state. Use a sensible fallback when `nextRecipes` is empty (e.g. a default recipe or `null`).
3. Call `loadDatabaseRecipes()`.

Alternatively, use a single functional update that returns both the next list and the next selected recipe, or a `useEffect` that watches `recipes` and fixes `selectedRecipe` when the current one was removed.

---

### 1.2 Recipe DB vs local merge (Medium)

**Issue:** `loadDatabaseRecipes` only populates `databaseRecipes`. Local `recipes` come from localStorage. There’s no merge like ingredients: DB priority, replace local duplicates.

**Impact:** Duplicate recipes (same name) can exist; unclear source of truth.

**Improvements:**

- **Define “DB recipe”** (e.g. by `id` prefix or a `source: 'db' | 'local'`).
- **Merge strategy:** DB recipes first; local-only if no DB match by `id` or `name`.
- **Persist:** Only store the merged list (or clearly separated DB vs local) so reload is consistent.

---

### 1.3 Recipe delete from DB (Medium)

**Issue:** `handleDelete` in `RecipeManagerModal` is commented out. No UI to delete a recipe in DB.

**Improvements:**

- Re-enable delete in the modal.
- Call `supabase.from('recipes').delete().eq('id', id)` when deleting from DB.
- Call `onRecipeDeleted` so parent can update `recipes` and `selectedRecipe` (using the fixed `handleRecipeDeleted`).
- If recipe has an image in S3, optionally delete it via upload API when deleting the recipe.

---

### 1.4 Recipe create: duplicate name check (Low)

**Issue:** New recipe can share a name with an existing one.

**Improvement:** Before insert/upsert, check by `name` (and optionally `batch_size`). If exists, either warn and edit existing or force a different name.

---

### 1.5 Recipe upsert shape (Low)

**Issue:** Upsert sends `created_at` every time. Usually `created_at` is set only on insert.

**Improvement:** Use `updated_at` for upsert; set `created_at` only when inserting a new row (or rely on DB defaults).

---

## 2. Tools CRUD

### 2.1 Tools are local-only (High)

**Issue:** Tools live only in React state + localStorage. No Supabase (or other backend).

**Impact:** Not synced across devices/users; no shared “tool inventory” for recipes and cost.

**Improvements:**

- Add `tools` table in Supabase (name, type, category, totalInvestment, recoveryValue, costPerBatch, etc.).
- Implement `loadToolsFromSupabase`, `saveToolToSupabase`, `deleteToolFromSupabase`.
- Mirror ingredient-style merge: **DB tools first**, local-only if no DB match (e.g. by `name` + `category` or stable id).
- Add `toolsInDatabase: Set<string>` and use it for UI (e.g. “DB” vs “Local” badge).

---

### 2.2 Tool duplicate check (Medium)

**Issue:** `addTool` doesn’t check for existing tool with same name (and category).

**Improvement:** Before add, ensure no tool with same `name` (+ `category`) exists. Show error or focus existing tool for edit.

---

### 2.3 Tool edit/delete and recipes (Medium)

**Issue:** Editing or deleting a tool doesn’t update recipes that reference it. Recipes store `toolId`; if a tool is removed, those references break.

**Improvements:**

- On delete: either **block** delete if any recipe uses the tool, or **cascade**: remove `RecipeTool` entries with that `toolId` (and optionally warn user).
- On edit: tool id stays same; recipe references remain valid. Only ensure cost math uses updated `costPerBatch`.

---

### 2.4 Typo and `Tool` type (Low)

**Issue:** `EditableToolRow` option `"herramientaio"`; `Tool` type doesn’t include `cost` but `ToolsPanel` uses it.

**Improvement:** Fix typo; align form state with `Tool` (use `costPerBatch` only, remove `cost`).

---

## 3. Inventory CRUD

### 3.1 Inventory is local-only (High)

**Issue:** Inventory is only in state + localStorage. No DB.

**Impact:** Can’t share inventory across devices; inconsistent with ingredient DB.

**Improvements:**

- Add `inventory` (or `ingredient_stock`) table: `ingredient_id`, `current_stock`, `unit`, `minimum_stock`, `last_updated`, etc.
- Implement `loadInventoryFromSupabase`, `updateInventoryInSupabase` (and optionally create/delete).
- **Merge:** DB inventory overrides local for same `ingredient_id`; optionally keep local-only rows if you allow “local-only” ingredients.

---

### 3.2 `updateInventory` and `lastUpdated` (Low)

**Issue:** `InventoryItem` has `lastUpdated` but it’s not consistently set on manual stock changes.

**Improvement:** When updating stock (manual or production), set `lastUpdated` to `new Date().toISOString()` and persist it.

---

### 3.3 Inventory validation (Low)

**Issue:** No guard against negative stock apart from `Math.max(0, ...)` in production deduction.

**Improvement:** Validate in `updateInventory` (and any other write path): `currentStock >= 0`, optionally `minimumStock >= 0`, and clear error messages.

---

## 4. Production CRUD

### 4.1 Production is local-only (High)

**Issue:** Production history is state + localStorage; mock data generator runs on load. No DB.

**Impact:** Production data not shared; lost on clear storage; `ProductionTrackerPanel` can’t be used as a real production log.

**Improvements:**

- Add `production_records` table (recipe_id, batch_count, date, total_produced, status, etc.) and optionally `production_items` (record_id, status, quantity).
- Implement `loadProductionFromSupabase`, `createProductionRecord`, `updateProductionStatus`.
- **Merge:** Prefer DB; optionally keep local-only records during migration.

---

### 4.2 Production status updates not persisted (Medium)

**Issue:** `handleItemStatusChange` updates local state and calls `updateProductionStatus`, but parent doesn’t persist it. Production records in state/localStorage don’t store per-item status updates.

**Improvement:** Either (a) extend `ProductionRecord` / stored shape to include `items` with status and persist that, or (b) move to DB and persist status updates there. Then ensure `ProductionTrackerPanel` reads from the same source.

---

### 4.3 `recordProduction` and inventory (Medium)

**Issue:** Production deducts inventory in memory and updates `inventory` state, but inventory isn’t synced to any backend. If you add DB inventory later, production deductions must be written there too.

**Improvement:** When adding inventory backend, ensure `recordProduction` (or a shared “deduct inventory” helper) updates both local state and DB.

---

## 5. Cross‑cutting CRUD

### 5.1 Centralized persistence layer (Medium)

**Issue:** Supabase and localStorage are used ad hoc across components. Hard to reuse, test, or swap storage.

**Improvement:** Introduce small modules or hooks, e.g.:

- `useIngredients()` → load, save, delete, merge logic.
- `useRecipes()` → same for recipes.
- `useTools()`, `useInventory()`, `useProduction()` when those get backends.

Each encapsulates “load from DB + merge with local” and “write to DB + update state”.

---

### 5.2 Optimistic updates (Low)

**Issue:** Most mutations await Supabase then update state. UI feels slow.

**Improvement:** For non-critical paths, update state first (optimistic), then sync to DB. On failure, revert state and show error.

---

### 5.3 Loading and error states (Low)

**Issue:** No global loading/error handling for CRUD. Some actions show local error, others fail silently.

**Improvement:** Per-entity or global loading flags (e.g. `ingredientsLoading`, `recipesError`). Disable buttons / show spinners during save/delete; show toasts or inline errors on failure.

---

### 5.4 Idempotency and concurrent edits (Low)

**Issue:** No handling of concurrent updates (e.g. two tabs editing same recipe or ingredient).

**Improvement:** Use `updated_at` (or version) from DB; on save, detect conflicts and either overwrite, merge, or prompt user. Less critical until multi-user.

---

## 6. Summary checklist

| Area | Improvement | Priority |
|------|-------------|----------|
| **Recipes** | Fix `handleRecipeDeleted` stale state | High |
| **Recipes** | DB vs local merge + single source of truth | Medium |
| **Recipes** | Re-enable delete in DB + `onRecipeDeleted` | Medium |
| **Recipes** | Duplicate name check on create | Low |
| **Tools** | Add Supabase tools CRUD + DB/local merge | High |
| **Tools** | Duplicate name check on add | Medium |
| **Tools** | Handle tool delete when used in recipes | Medium |
| **Tools** | Fix typo and `Tool` type | Low |
| **Inventory** | Add Supabase inventory CRUD | High |
| **Inventory** | `lastUpdated` and validation | Low |
| **Production** | Add Supabase production CRUD | High |
| **Production** | Persist status updates | Medium |
| **Production** | Tie deductions to DB inventory | Medium |
| **General** | Centralized persistence (hooks/services) | Medium |
| **General** | Optimistic updates, loading/error UI | Low |

Implementing **Recipes 1.1**, **Tools 2.1**, and **Inventory 3.1** will bring the main entities in line with the improved **Ingredients** CRUD and give you a solid base for inventory, recipes, and profit calculations.
