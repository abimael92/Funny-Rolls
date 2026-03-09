"use client"

import { useEffect, useState } from "react"
import ProtectedContent from "@/components/ProtectedContent"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar" // ADD THIS

interface SettingsData {
  store_name: string
  tax_rate: number
  receipt_footer: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cart] = useState([]) // ADD THIS - empty cart for admin

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/settings").catch(() => null)
      if (!res || !res.ok) {
        throw new Error("Settings API not available")
      }
      const data = await res.json()
      setSettings({
        store_name: data.store_name ?? "Funny Rolls",
        tax_rate: Number(data.tax_rate ?? 0),
        receipt_footer: data.receipt_footer ?? "",
      })
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error loading settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).catch(() => null)
      if (!res || !res.ok) {
        throw new Error("Error saving settings")
      }
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error saving settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedContent requiredRole="admin">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} /> {/* ADD THIS */}
        <div className="py-8 px-4 sm:px-20"> {/* FIXED: Match other admin pages padding */}
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                Settings
              </h1>
              <p className="text-sm text-amber-800/80">
                Configure store settings, tax rates, and receipt footer.
              </p>
            </div>

            {loading && (
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-6 bg-amber-50 rounded-lg animate-pulse" />
                <div className="h-24 bg-amber-50 rounded-lg animate-pulse" />
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && settings && (
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Store name
                  </label>
                  <input
                    value={settings.store_name}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, store_name: e.target.value } : prev
                      )
                    }
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Tax rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? { ...prev, tax_rate: Number(e.target.value || "0") }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Receipt footer
                  </label>
                  <textarea
                    rows={4}
                    value={settings.receipt_footer}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, receipt_footer: e.target.value } : prev
                      )
                    }
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-amber-600 hover:bg-amber-700 text-white px-6"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}