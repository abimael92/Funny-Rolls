"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, History } from "lucide-react"
import ProtectedContent from "@/components/ProtectedContent"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar" // ADD THIS

interface Ingredient {
  id: string
  name: string
  current_stock: number
  unit: string
  reorder_level: number | null
}

interface Transaction {
  id: string
  ingredient_id: string
  quantity: number
  type: "order" | "production" | "restock" | "adjustment"
  reference_id?: string | null
  created_at: string
}

export default function AdminInventoryPage() {
  const searchParams = useSearchParams()
  const ingredientFilter = searchParams?.get("ingredient") ?? ""

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(
    ingredientFilter || null
  )
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [cart] = useState([]) // ADD THIS - empty cart for admin

  const [adjustAmount, setAdjustAmount] = useState<string>("")
  const [adjustNotes, setAdjustNotes] = useState<string>("")
  const [savingAdjust, setSavingAdjust] = useState(false)

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/inventory/alerts")
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Error loading inventory")
        }
        const lowData = await res.json()
        const items = (lowData.items || []) as any[]
        setIngredients(
          items.map((i) => ({
            id: i.id,
            name: i.name,
            current_stock: i.current_stock,
            unit: i.unit,
            reorder_level: i.reorder_level ?? 0,
          }))
        )

        if (ingredientFilter && !selectedIngredientId) {
          setSelectedIngredientId(ingredientFilter)
        }
      } catch (e: any) {
        console.error(e)
        setError(e.message || "Error loading inventory")
      } finally {
        setLoading(false)
      }
    }

    fetchIngredients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedIngredientId) return
    const fetchTransactions = async () => {
      setTxLoading(true)
      setTxError(null)
      try {
        const res = await fetch(
          `/api/inventory/transactions?ingredientId=${selectedIngredientId}&limit=50`
        )
        if (!res.ok) throw new Error("Error loading transactions")
        const data = await res.json()
        setTransactions(data.transactions || [])
      } catch (e: any) {
        console.error(e)
        setTxError(e.message || "Error loading transactions")
      } finally {
        setTxLoading(false)
      }
    }
    fetchTransactions()
  }, [selectedIngredientId])

  const isLowStock = (ing: Ingredient) =>
    ing.reorder_level != null &&
    Number(ing.current_stock ?? 0) <= Number(ing.reorder_level ?? 0)

  const handleAdjust = async () => {
    if (!selectedIngredientId || !adjustAmount) return
    const delta = Number(adjustAmount)
    if (!Number.isFinite(delta) || delta === 0) return
    setSavingAdjust(true)
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId: selectedIngredientId,
          delta,
          type: "adjustment",
          notes: adjustNotes || undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Error updating stock")
      }
      setIngredients((prev) =>
        prev.map((i) =>
          i.id === selectedIngredientId
            ? { ...i, current_stock: Number(i.current_stock ?? 0) + delta }
            : i
        )
      )
      setAdjustAmount("")
      setAdjustNotes("")
      const txRes = await fetch(
        `/api/inventory/transactions?ingredientId=${selectedIngredientId}&limit=50`
      )
      if (txRes.ok) {
        const txJson = await txRes.json()
        setTransactions(txJson.transactions || [])
      }
    } catch (e: any) {
      console.error(e)
      setTxError(e.message || "Error updating stock")
    } finally {
      setSavingAdjust(false)
    }
  }

  const selected = ingredients.find((i) => i.id === selectedIngredientId) || null

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} /> {/* ADD THIS */}
        <div className="py-8 px-4 sm:px-20"> {/* FIXED: Match production page padding */}
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                Inventory
              </h1>
              <p className="text-sm text-amber-800/80">
                Monitor ingredient stock levels and record adjustments.
              </p>
            </div>

            {loading && (
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-6 bg-amber-50 rounded-lg animate-pulse" />
                <div className="h-40 bg-amber-50 rounded-lg animate-pulse" />
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ingredients list */}
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-amber-900">
                      Ingredients
                    </h2>
                  </div>
                  <div className="max-h-[440px] overflow-y-auto space-y-2 pr-1">
                    {ingredients.map((ing) => (
                      <button
                        key={ing.id}
                        onClick={() => setSelectedIngredientId(ing.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-sm flex items-center justify-between gap-2 ${selectedIngredientId === ing.id
                            ? "bg-amber-100/80 border-amber-400"
                            : "bg-amber-50/70 border-amber-200 hover:bg-amber-100/60"
                          }`}
                      >
                        <div>
                          <p className="font-medium text-amber-900">{ing.name}</p>
                          <p className="text-xs text-amber-800/80">
                            {ing.current_stock} {ing.unit}
                          </p>
                        </div>
                        {isLowStock(ing) && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-200 text-amber-900">
                            <AlertTriangle className="h-3 w-3" />
                            Low
                          </span>
                        )}
                      </button>
                    ))}

                    {!ingredients.length && (
                      <p className="text-sm text-amber-800/80 py-8 text-center">
                        No ingredients found.
                      </p>
                    )}
                  </div>
                </div>

                {/* Rest of your content remains exactly the same... */}
                {/* Detail + adjustment */}
                <div className="space-y-4">
                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-amber-900 mb-3">
                      Details
                    </h2>
                    {selected ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-900">
                          {selected.name}
                        </p>
                        <p className="text-xs text-amber-800/80">
                          Current stock:{" "}
                          <span className="font-semibold">
                            {selected.current_stock} {selected.unit}
                          </span>
                        </p>
                        <p className="text-xs text-amber-800/80">
                          Reorder level:{" "}
                          {selected.reorder_level != null
                            ? `${selected.reorder_level} ${selected.unit}`
                            : "Not set"}
                        </p>
                        {isLowStock(selected) && (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-1 text-xs text-amber-900">
                            <AlertTriangle className="h-4 w-4" />
                            Low stock, consider restocking.
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-800/80">
                        Select an ingredient to view details.
                      </p>
                    )}
                  </div>

                  {/* Stock adjustment section - keep as is */}
                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <h2 className="text-sm font-semibold text-amber-900">
                      Stock adjustment
                    </h2>
                    <p className="text-xs text-amber-800/80">
                      Use positive values to add stock, negative to subtract.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-amber-800 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="+5 or -2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-amber-800 mb-1">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={adjustNotes}
                          onChange={(e) => setAdjustNotes(e.target.value)}
                          className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Reason for adjustment"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={handleAdjust}
                        disabled={!selected || savingAdjust}
                        className="rounded-full bg-amber-600 hover:bg-amber-700 text-white px-4"
                      >
                        Save adjustment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAdjustAmount("")
                          setAdjustNotes("")
                        }}
                        className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-50"
                      >
                        Clear
                      </Button>
                    </div>

                    {txError && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        {txError}
                      </p>
                    )}
                  </div>

                  {/* Transaction history - keep as is */}
                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Transaction history
                      </h2>
                    </div>

                    {txLoading && (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-10 bg-amber-50 rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    )}

                    {!txLoading && !selected && (
                      <p className="text-sm text-amber-800/80">
                        Select an ingredient to view transactions.
                      </p>
                    )}

                    {!txLoading && selected && (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between text-xs border-b border-amber-50 py-2 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              {tx.quantity >= 0 ? (
                                <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 text-red-600" />
                              )}
                              <div>
                                <p className="font-medium text-amber-900">
                                  {tx.type}
                                </p>
                                <p className="text-[11px] text-amber-800/80">
                                  {new Date(tx.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-amber-900">
                              {tx.quantity > 0 ? "+" : ""}
                              {tx.quantity.toFixed(2)}
                            </p>
                          </div>
                        ))}

                        {!transactions.length && (
                          <p className="text-sm text-amber-800/80 py-4">
                            No transactions for this ingredient yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}