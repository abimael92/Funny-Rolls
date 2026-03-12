 "use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarIcon,
  Filter,
  Loader2,
  Plus,
  ScrollText,
} from "lucide-react";
import ProtectedContent from "@/components/ProtectedContent";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useProductionManagement } from "@/hooks/useProductionManagement";
import type { ProductionRecord } from "@/lib/types";

const EMPTY_CART: never[] = [];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

/**
 * Admin production management page:
 * - Uses only real Supabase tables via useProductionManagement
 * - No mock data, all calculations based on Recipe/Ingredient types
 * - Provides filtering, scheduling, status management, reporting and exports
 */
export default function AdminProductionPage() {
  const [plannedDate, setPlannedDate] = useState<string>("");
  const [newRecipeId, setNewRecipeId] = useState<string>("");
  const [newBatchCount, setNewBatchCount] = useState<string>("1");
  const [newNotes, setNewNotes] = useState<string>("");

  const {
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
    recipes,
    ingredientRequirements,
    totalPlannedCost,
    totalPlannedYield,
    toasts,
    dismissToast,
  } = useProductionManagement();

  const recipeOptions = useMemo(
    () =>
      recipes.map((r) => ({
        id: r.id,
        label: r.name,
      })),
    [recipes]
  );

  const handleCreateBatch = async () => {
    const batchCountNumeric = Number.parseInt(newBatchCount, 10);
    if (!newRecipeId || !Number.isFinite(batchCountNumeric) || batchCountNumeric <= 0) {
      return;
    }
    const recipe = recipes.find((r) => r.id === newRecipeId);
    await createBatch({
      recipeId: newRecipeId,
      recipeName: recipe?.name,
      batchCount: batchCountNumeric,
      plannedDate: plannedDate || null,
      notes: newNotes || undefined,
    });
    setNewRecipeId("");
    setNewBatchCount("1");
    setPlannedDate("");
    setNewNotes("");
  };

  const handleExportCsv = () => {
    if (!records.length) return;
    const header = [
      "id",
      "recipeId",
      "recipeName",
      "batchCount",
      "status",
      "plannedDate",
      "date",
      "totalProduced",
      "productionCost",
      "wasteCost",
      "notes",
    ];
    const rows = records.map((r) => [
      r.id,
      r.recipeId,
      `"${r.recipeName}"`,
      r.batchCount.toString(),
      r.status ?? "",
      r.plannedDate ?? "",
      r.date,
      r.totalProduced.toString(),
      r.productionCost?.toFixed(2) ?? "",
      r.wasteCost?.toFixed(2) ?? "",
      r.notes ? `"${r.notes.replace(/"/g, '""')}"` : "",
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "production-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (record: ProductionRecord) => {
    const status = record.status ?? "planned";
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "planned":
        return <span className={`${base} bg-blue-100 text-blue-800`}>Planned</span>;
      case "in_progress":
        return <span className={`${base} bg-amber-100 text-amber-800`}>In progress</span>;
      case "completed":
        return <span className={`${base} bg-green-100 text-green-800`}>Completed</span>;
      case "cancelled":
        return <span className={`${base} bg-red-100 text-red-800`}>Cancelled</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
    }
  };

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={EMPTY_CART} onCartOpen={() => {}} />

        {/* Toasts */}
        {toasts.length > 0 && (
          <div
            aria-live="polite"
            className="fixed z-50 inset-x-0 top-20 flex flex-col items-center gap-2 px-4"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`max-w-md w-full rounded-xl px-4 py-3 shadow-lg border text-sm flex justify-between items-center ${
                  t.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
                role="status"
              >
                <span>{t.message}</span>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismissToast(t.id)}
                  className="ml-3 text-xs font-semibold opacity-70 hover:opacity-100"
                >
                  Close
                </button>
              </div>
            ))}
          </div>
        )}

        <main className="py-6 px-4 sm:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header & summary */}
            <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                  Production management
                </h1>
                <p className="text-sm text-amber-800/80 max-w-xl">
                  Plan, track and analyze production using real recipes, ingredients and
                  inventory data.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-xs uppercase tracking-wide text-amber-700/70">
                  Planned yield
                </div>
                <div className="text-lg font-semibold text-amber-900">
                  {totalPlannedYield.toFixed(0)} units
                </div>
                <div className="text-xs text-amber-700/80">
                  Est. ingredient cost:{" "}
                  <span className="font-semibold">
                    ${totalPlannedCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            {/* Filters */}
            <section className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-semibold">Filters</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateRange.from ?? ""}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, from: e.target.value || null })
                    }
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateRange.to ?? ""}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, to: e.target.value || null })
                    }
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as typeof statusFilter)
                    }
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-amber-800 mb-1">
                        Recipe search
                      </label>
                      <input
                        value={recipeSearch}
                        onChange={(e) => setRecipeSearch(e.target.value)}
                        placeholder="Name or ID"
                        className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-800 mb-1">
                      Recipe type (optional)
                    </label>
                    <input
                      value={recipeTypeFilter}
                      onChange={(e) => setRecipeTypeFilter(e.target.value)}
                      placeholder="e.g. rolls, bread"
                      className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* New batch */}
            <section className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-semibold">Plan new batch</span>
                </div>
                <Link
                  href="/admin/calculator"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-[#C48A6A] hover:text-[#B37959] font-semibold"
                >
                  <ScrollText className="h-3 w-3" />
                  Recipes calculator
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Recipe
                  </label>
                  <select
                    aria-label="Select recipe"
                    value={newRecipeId}
                    onChange={(e) => setNewRecipeId(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select recipe</option>
                    {recipeOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Planned date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-amber-700/70" />
                    <input
                      type="date"
                      aria-label="Planned date"
                      value={plannedDate}
                      onChange={(e) => setPlannedDate(e.target.value)}
                      className="w-full pl-9 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Batch count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newBatchCount}
                    onChange={(e) => setNewBatchCount(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateBatch}
                  disabled={creating || !newRecipeId}
                  className="rounded-full bg-amber-600 hover:bg-amber-700 text-white px-4"
                >
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Schedule batch
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={handleExportCsv}
                  disabled={!records.length}
                  className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-50 px-4"
                >
                  Export CSV
                </Button>
              </div>
            </section>

            {/* Batches table / schedule */}
            <section className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-amber-900">
                  Production schedule & history
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-amber-50 text-amber-900">
                      <th className="px-3 py-2 text-left font-semibold">Recipe</th>
                      <th className="px-3 py-2 text-left font-semibold">Planned</th>
                      <th className="px-3 py-2 text-left font-semibold">Produced at</th>
                      <th className="px-3 py-2 text-left font-semibold">Batches</th>
                      <th className="px-3 py-2 text-left font-semibold">Units</th>
                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                      <th className="px-3 py-2 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => {
                      const ingredientsForBatch = ingredientRequirements[r.id] ?? [];
                      const recipe = recipes.find((rec) => rec.id === r.recipeId);
                      const units = recipe ? recipe.batchSize * r.batchCount : r.totalProduced;

                      return (
                        <tr
                          key={r.id}
                          className="border-t border-amber-100 hover:bg-amber-50/60 transition-colors"
                        >
                          <td className="px-3 py-2 align-top">
                            <div className="font-medium text-amber-900">
                              {r.recipeName}
                            </div>
                            <div className="text-[11px] text-amber-800/80">
                              ID: {r.id.slice(0, 8)}…
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-amber-900/80">
                            {r.plannedDate ? (
                              <span>{r.plannedDate}</span>
                            ) : (
                              <span className="text-amber-600/70 italic">Not set</span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top text-amber-900/80">
                            {formatShortDate(r.date)}
                          </td>
                          <td className="px-3 py-2 align-top text-amber-900">
                            {r.batchCount}
                          </td>
                          <td className="px-3 py-2 align-top text-amber-900">
                            {units}
                          </td>
                          <td className="px-3 py-2 align-top">{renderStatusBadge(r)}</td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="xs"
                                variant="outline"
                                aria-label="Mark as in progress"
                                disabled={updatingStatus}
                                onClick={() =>
                                  updateBatchStatus({
                                    batchId: r.id,
                                    status: "in_progress",
                                  })
                                }
                                className="border-amber-300 text-amber-900 hover:bg-amber-50"
                              >
                                In progress
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                aria-label="Mark as completed"
                                disabled={updatingStatus}
                                onClick={() =>
                                  updateBatchStatus({
                                    batchId: r.id,
                                    status: "completed",
                                  })
                                }
                                className="border-emerald-300 text-emerald-900 hover:bg-emerald-50"
                              >
                                Done
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                aria-label="Cancel batch"
                                disabled={updatingStatus}
                                onClick={() =>
                                  updateBatchStatus({
                                    batchId: r.id,
                                    status: "cancelled",
                                  })
                                }
                                className="border-red-300 text-red-900 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!records.length && !loading && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-8 text-center text-sm text-amber-800/80"
                        >
                          No production batches found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="flex items-center justify-center py-4 text-sm text-amber-800/80">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading production data…
                </div>
              )}
              {!loading && hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadMore}
                    className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-50"
                  >
                    Load more
                  </Button>
                </div>
              )}
              {error && (
                <div className="mt-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </ProtectedContent>
  );
}
