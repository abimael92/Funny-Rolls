"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import ProtectedContent from "@/components/ProtectedContent"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar" // ADD THIS

interface Batch {
  id: string
  recipe_id: string
  recipe_name: string | null
  batch_count: number
  produced_at: string | null
  created_at: string
}

export default function AdminProductionPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart] = useState([]) // ADD THIS - empty cart for admin

  const [recipeId, setRecipeId] = useState("")
  const [recipeName, setRecipeName] = useState("")
  const [batchCount, setBatchCount] = useState("1")
  const [saving, setSaving] = useState(false)

  const loadBatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/production/history?limit=50")
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Error loading production history")
      }
      const data = await res.json()
      setBatches(data.batches || [])
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error loading production history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBatches()
  }, [])

  const handleRecordBatch = async () => {
    const count = Number(batchCount || "0")
    if (!recipeId || !Number.isFinite(count) || count <= 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/production/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          recipeName: recipeName || undefined,
          batchCount: count,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.error) {
        throw new Error(body.error || "Error recording batch")
      }
      setRecipeId("")
      setRecipeName("")
      setBatchCount("1")
      await loadBatches()
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error recording batch")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} /> {/* ADD THIS */}
        <div className="py-8 px-4 sm:px-20">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                Production
              </h1>
              <p className="text-sm text-amber-800/80">
                Record production batches and review recent history.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {/* Record new batch */}
            <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-amber-900">
                Record new batch
              </h2>
              <p className="text-xs text-amber-800/80">
                Link this batch to a recipe (you can copy the recipe id from the calculator).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Recipe ID
                  </label>
                  <input
                    value={recipeId}
                    onChange={(e) => setRecipeId(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="recipe-..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Recipe name (optional)
                  </label>
                  <input
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Cinnamon Rolls"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Batch count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batchCount}
                    onChange={(e) => setBatchCount(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleRecordBatch}
                  disabled={saving || !recipeId}
                  className="rounded-full bg-amber-600 hover:bg-amber-700 text-white px-4"
                >
                  Save batch
                </Button>
                <Link
                  href="/admin/calculator"
                  className="text-xs sm:text-sm text-[#C48A6A] hover:text-[#B37959] font-semibold"
                >
                  Go to recipes calculator
                </Link>
              </div>
            </div>

            {/* History */}
            <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-amber-900 mb-3">
                Recent batches
              </h2>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-amber-50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {batches.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-xs border-b border-amber-50 py-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-amber-900">
                          {b.recipe_name || b.recipe_id}
                        </p>
                        <p className="text-[11px] text-amber-800/80">
                          {b.batch_count} batch(es) ·{" "}
                          {b.produced_at
                            ? format(new Date(b.produced_at), "yyyy-MM-dd HH:mm")
                            : format(new Date(b.created_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                      <p className="text-[11px] text-amber-800/70">
                        ID: {b.id}
                      </p>
                    </div>
                  ))}

                  {!batches.length && (
                    <p className="text-sm text-amber-800/80 py-4">
                      No production batches recorded yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}