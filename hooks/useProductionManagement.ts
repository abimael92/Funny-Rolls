"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Ingredient,
  InventoryItem,
  ProductionRecord,
  ProductionStatus,
  Recipe,
} from "@/lib/types";

const BATCH_PAGE_SIZE = 25;

type DateRange = {
  from: string | null;
  to: string | null;
};

type BatchStatusFilter =
  | "all"
  | Extract<
      ProductionStatus,
      "planned" | "in_progress" | "completed" | "cancelled"
    >;

interface UseProductionManagementOptions {
  /** Optional initial date range filter (ISO dates, yyyy-MM-dd). */
  initialRange?: DateRange;
}

interface UseProductionManagementResult {
  loading: boolean;
  error: string | null;
  records: ProductionRecord[];
  hasMore: boolean;
  loadMore: () => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  statusFilter: BatchStatusFilter;
  setStatusFilter: (status: BatchStatusFilter) => void;
  recipeSearch: string;
  setRecipeSearch: (value: string) => void;
  recipeTypeFilter: string;
  setRecipeTypeFilter: (value: string) => void;
  creating: boolean;
  createBatch: (input: {
    recipeId: string;
    recipeName?: string;
    batchCount: number;
    plannedDate?: string | null;
    notes?: string;
  }) => Promise<void>;
  updatingStatus: boolean;
  updateBatchStatus: (params: {
    batchId: string;
    status: Extract<
      ProductionStatus,
      "planned" | "in_progress" | "completed" | "cancelled"
    >;
  }) => Promise<void>;
  ingredients: Ingredient[];
  recipes: Recipe[];
  inventory: InventoryItem[];
  ingredientRequirements: Record<string, { ingredientId: string; amount: number }[]>;
  totalPlannedCost: number;
  totalPlannedYield: number;
  toasts: { id: number; type: "success" | "error"; message: string }[];
  dismissToast: (id: number) => void;
}

/**
 * Hook encapsulating all Supabase-backed production management logic:
 * - Fetches production batches, recipes, ingredients and inventory from real tables
 * - Tracks filters, pagination and debounced recipe search
 * - Supports creating batches via the existing /api/production/record endpoint
 * - Supports updating batch status directly against the production_batches table
 * - Subscribes to realtime changes on production_batches for live updates
 * - Computes ingredient requirements, costs and yield using existing Recipe/Ingredient types
 */
export function useProductionManagement(
  options: UseProductionManagementOptions = {}
): UseProductionManagementResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [dateRange, setDateRange] = useState<DateRange>(
    options.initialRange ?? { from: null, to: null }
  );
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>("all");
  const [recipeSearch, setRecipeSearch] = useState<string>("");
  const [recipeSearchDebounced, setRecipeSearchDebounced] =
    useState<string>("");
  const [recipeTypeFilter, setRecipeTypeFilter] = useState<string>("");

  const [creating, setCreating] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [toastSeq, setToastSeq] = useState<number>(0);
  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);

  const pushToast = useCallback(
    (payload: { type: "success" | "error"; message: string }) => {
      setToastSeq((prev) => prev + 1);
      setToasts((prev) => [
        ...prev,
        { id: toastSeq + 1, type: payload.type, message: payload.message },
      ]);
    },
    [toastSeq]
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Basic error helper that only logs in development
  const logError = useCallback((message: string, err: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(message, err);
    }
  }, []);

  // Debounce recipe search for better UX
  useEffect(() => {
    const handle = window.setTimeout(
      () => setRecipeSearchDebounced(recipeSearch.trim()),
      350
    );
    return () => window.clearTimeout(handle);
  }, [recipeSearch]);

  /**
   * Map a raw production_batches row into the domain ProductionRecord type.
   */
  const mapBatchToRecord = useCallback(
    (row: {
      id: string;
      recipe_id: string;
      recipe_name: string | null;
      batch_count: number;
      produced_at: string | null;
      created_at: string;
      status?: string | null;
      planned_for?: string | null;
      total_produced?: number | null;
      production_cost?: number | null;
      recipe_type?: string | null;
      unit_price?: number | null;
      waste_cost?: number | null;
      notes?: string | null;
    }): ProductionRecord => {
      const safeStatus = (row.status ?? undefined) as
        | ProductionStatus
        | undefined;
      const totalProduced =
        typeof row.total_produced === "number"
          ? row.total_produced
          : row.batch_count;

      return {
        id: row.id,
        recipeId: row.recipe_id,
        recipeName: row.recipe_name ?? row.recipe_id,
        batchCount: row.batch_count,
        date: row.produced_at ?? row.created_at,
        totalProduced,
        status: safeStatus,
        plannedDate: row.planned_for ?? undefined,
        completedAt: row.produced_at ?? undefined,
        recipeType: row.recipe_type ?? undefined,
        unitPrice:
          typeof row.unit_price === "number" ? row.unit_price : undefined,
        productionCost:
          typeof row.production_cost === "number"
            ? row.production_cost
            : undefined,
        wasteCost:
          typeof row.waste_cost === "number" ? row.waste_cost : undefined,
        notes: row.notes ?? undefined,
      };
    },
    []
  );

  /**
   * Fetch a page of production batches from Supabase, respecting filters.
   */
  const fetchBatches = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const from = pageToLoad * BATCH_PAGE_SIZE;
        const to = from + BATCH_PAGE_SIZE - 1;

        let query = supabase
          .from("production_batches")
          .select(
            "id, recipe_id, recipe_name, batch_count, produced_at, created_at, status, planned_for, total_produced, production_cost, recipe_type, unit_price, waste_cost, notes",
            { count: "exact" }
          )
          .order("created_at", { ascending: false })
          .range(from, to);

        if (dateRange.from) {
          query = query.gte("created_at", `${dateRange.from}T00:00:00.000Z`);
        }
        if (dateRange.to) {
          query = query.lte("created_at", `${dateRange.to}T23:59:59.999Z`);
        }
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        if (recipeTypeFilter) {
          query = query.ilike("recipe_type", `%${recipeTypeFilter}%`);
        }
        if (recipeSearchDebounced) {
          query = query.or(
            `recipe_name.ilike.%${recipeSearchDebounced}%,recipe_id.ilike.%${recipeSearchDebounced}%`
          );
        }

        const { data, error: dbError, count } = await query;

        if (dbError) {
          throw dbError;
        }

        const mapped = (data ?? []).map(mapBatchToRecord);
        setRecords((prev) => (replace ? mapped : [...prev, ...mapped]));

        const totalCount = count ?? mapped.length;
        setHasMore(to + 1 < totalCount);
      } catch (err) {
        logError("Failed to load production batches", err);
        const message =
          err instanceof Error ? err.message : "Error loading production data";
        setError(message);
        pushToast({ type: "error", message });
      } finally {
        setLoading(false);
      }
    },
    [
      dateRange.from,
      dateRange.to,
      statusFilter,
      recipeTypeFilter,
      recipeSearchDebounced,
      mapBatchToRecord,
      logError,
      pushToast,
    ]
  );

  /**
   * Fetch reference data: recipes, ingredients and inventory from real tables.
   */
  const fetchReferenceData = useCallback(async () => {
    try {
      const [recipesRes, ingredientsRes] = await Promise.all([
        supabase.from("recipes").select("*").order("name", { ascending: true }),
        supabase
          .from("ingredients")
          .select(
            "id, name, price, unit, amount, min_amount, min_amount_unit, current_stock, reorder_level, price_per_unit"
          )
          .order("name", { ascending: true }),
      ]);

      if (recipesRes.error) throw recipesRes.error;
      if (ingredientsRes.error) throw ingredientsRes.error;

      const mappedRecipes: Recipe[] = (recipesRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        ingredients: r.ingredients ?? [],
        tools: r.tools ?? [],
        batchSize: r.batch_size,
        sellingPrice: r.selling_price,
        profitMargin: r.profit_margin,
        available: r.available,
        steps: r.steps ?? [],
        image: r.image ?? undefined,
      }));

      const mappedIngredients: Ingredient[] = (ingredientsRes.data ?? []).map(
        (i) => ({
          id: i.id,
          name: i.name,
          price: i.price_per_unit ?? i.price ?? 0,
          unit: i.unit,
          amount: i.amount ?? 0,
          minAmount: i.min_amount ?? 0,
          minAmountUnit: i.min_amount_unit ?? i.unit,
          containsAmount: i.contains_amount ?? 0,
          containsUnit: i.contains_unit ?? i.unit,
        })
      );

      const mappedInventory: InventoryItem[] = (ingredientsRes.data ?? []).map(
        (i) => ({
          ingredientId: i.id,
          currentStock: Number(i.current_stock ?? 0),
          unit: i.unit,
          minimumStock: Number(i.reorder_level ?? 0),
          lastUpdated: undefined,
          costPerUnit:
            typeof i.price_per_unit === "number" ? i.price_per_unit : undefined,
        })
      );

      setRecipes(mappedRecipes);
      setIngredients(mappedIngredients);
      setInventory(mappedInventory);
    } catch (err) {
      logError("Failed to load production reference data", err);
      const message =
        err instanceof Error
          ? err.message
          : "Error loading production reference data";
      setError(message);
      pushToast({ type: "error", message });
    }
  }, [logError, pushToast]);

  // Initial load + re-load when filters change
  useEffect(() => {
    setPage(0);
    fetchReferenceData();
    fetchBatches(0, true);
  }, [fetchBatches, fetchReferenceData]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    void fetchBatches(nextPage, false);
  }, [page, loading, hasMore, fetchBatches]);

  /**
   * Create a new production batch using the existing API route
   * which handles inventory updates on the server.
   */
  const createBatch = useCallback(
    async (input: {
      recipeId: string;
      recipeName?: string;
      batchCount: number;
      plannedDate?: string | null;
      notes?: string;
    }) => {
      setCreating(true);
      setError(null);

      const safeBatchCount = Number.isFinite(input.batchCount)
        ? Math.max(1, Math.round(input.batchCount))
        : 1;

      try {
        const body: Record<string, unknown> = {
          recipeId: input.recipeId,
          recipeName: input.recipeName,
          batchCount: safeBatchCount,
        };

        if (input.plannedDate) {
          body.plannedDate = input.plannedDate;
        }
        if (input.notes) {
          body.notes = input.notes;
        }

        const res = await fetch("/api/production/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!res.ok || json?.error) {
          throw new Error(json?.error ?? "Failed to record production batch");
        }

        pushToast({
          type: "success",
          message: "Production batch recorded successfully",
        });

        // Refresh first page to include the new batch
        await fetchBatches(0, true);
      } catch (err) {
        logError("Failed to create production batch", err);
        const message =
          err instanceof Error
            ? err.message
            : "Error creating production batch";
        setError(message);
        pushToast({ type: "error", message });
      } finally {
        setCreating(false);
      }
    },
    [fetchBatches, logError, pushToast]
  );

  /**
   * Update batch status directly against the production_batches table
   * with optimistic UI update and rollback on failure.
   */
  const updateBatchStatus = useCallback(
    async (params: {
      batchId: string;
      status: Extract<
        ProductionStatus,
        "planned" | "in_progress" | "completed" | "cancelled"
      >;
    }) => {
      setUpdatingStatus(true);
      setError(null);

      const { batchId, status } = params;

      const previous = records;
      const optimistic = previous.map((r) =>
        r.id === batchId ? { ...r, status } : r
      );
      setRecords(optimistic);

      try {
        const { error: dbError } = await supabase
          .from("production_batches")
          .update({
            status,
            produced_at:
              status === "completed" ? new Date().toISOString() : undefined,
          })
          .eq("id", batchId);

        if (dbError) {
          throw dbError;
        }

        pushToast({
          type: "success",
          message: "Production status updated",
        });
      } catch (err) {
        logError("Failed to update production status", err);
        setRecords(previous);
        const message =
          err instanceof Error
            ? err.message
            : "Error updating production status";
        setError(message);
        pushToast({ type: "error", message });
      } finally {
        setUpdatingStatus(false);
      }
    },
    [records, logError, pushToast]
  );

  /**
   * Subscribe to realtime changes on production_batches to keep
   * the UI in sync with external updates.
   */
  useEffect(() => {
    const channel = supabase
      .channel("production_batches_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "production_batches",
        },
        (payload) => {
          setRecords((prev) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const record = mapBatchToRecord(
                payload.new as unknown as Parameters<typeof mapBatchToRecord>[0]
              );
              const existingIndex = prev.findIndex((r) => r.id === record.id);
              if (existingIndex >= 0) {
                const clone = [...prev];
                clone[existingIndex] = record;
                return clone;
              }
              return [record, ...prev];
            }
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id?: string }).id;
              if (!deletedId) return prev;
              return prev.filter((r) => r.id !== deletedId);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [mapBatchToRecord]);

  /**
   * Compute ingredient requirements for the current list of records
   * based on Recipe definitions and batch sizes.
   */
  const ingredientRequirements = useMemo(() => {
    const byBatchId: Record<
      string,
      { ingredientId: string; amount: number }[]
    > = {};

    for (const record of records) {
      const recipe = recipes.find((r) => r.id === record.recipeId);
      if (!recipe) continue;

      const scaleFactor = record.batchCount;
      const entries = recipe.ingredients.map((ri) => ({
        ingredientId: ri.ingredientId,
        amount: ri.amount * scaleFactor,
      }));

      byBatchId[record.id] = entries;
    }

    return byBatchId;
  }, [records, recipes]);

  /**
   * Aggregate planned cost and yield for the currently loaded records.
   */
  const { totalPlannedCost, totalPlannedYield } = useMemo(() => {
    let cost = 0;
    let yieldUnits = 0;

    for (const record of records) {
      const recipe = recipes.find((r) => r.id === record.recipeId);
      if (!recipe) continue;

      const ingredientsForBatch = ingredientRequirements[record.id] ?? [];

      for (const item of ingredientsForBatch) {
        const ingredient = ingredients.find((i) => i.id === item.ingredientId);
        if (!ingredient) continue;
        cost += ingredient.price * item.amount;
      }

      yieldUnits += recipe.batchSize * record.batchCount;
    }

    return { totalPlannedCost: cost, totalPlannedYield: yieldUnits };
  }, [records, recipes, ingredients, ingredientRequirements]);

  return {
    loading,
    error,
    records,
    hasMore,
    loadMore,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    recipeSearch,
    setRecipeSearch,
    recipeTypeFilter,
    setRecipeTypeFilter,
    creating,
    createBatch,
    updatingStatus,
    updateBatchStatus,
    ingredients,
    recipes,
    inventory,
    ingredientRequirements,
    totalPlannedCost,
    totalPlannedYield,
    toasts,
    dismissToast,
  };
}

