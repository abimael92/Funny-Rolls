"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import ProtectedContent from "@/components/ProtectedContent"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar" // ADD THIS

interface DailyReport {
  date: string
  orderCount: number
  paidCount: number
  totalSales: number
  averageTicket: number
}

interface MonthlyReport {
  year: string
  month: number
  orderCount: number
  paidCount: number
  totalSales: number
  averageTicket: number
}

export default function AdminReportsPage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null)
  const [topProducts, setTopProducts] = useState<
    { name: string; quantity: number; revenue: number }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart] = useState([]) // ADD THIS - empty cart for admin

  const loadReports = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const [dailyRes, monthlyRes] = await Promise.all([
        fetch(`/api/reports/sales/daily?date=${date}`),
        fetch(
          `/api/reports/sales/monthly?year=${date.slice(0, 4)}&month=${Number(
            date.slice(5, 7)
          )}`
        ),
      ])

      if (!dailyRes.ok) {
        const body = await dailyRes.json().catch(() => ({}))
        throw new Error(body.error || "Error loading daily sales")
      }
      if (!monthlyRes.ok) {
        const body = await monthlyRes.json().catch(() => ({}))
        throw new Error(body.error || "Error loading monthly sales")
      }

      const dailyJson = await dailyRes.json()
      const monthlyJson = await monthlyRes.json()

      setDaily(dailyJson)
      setMonthly(monthlyJson)

      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
        ; (dailyJson.orders || []).forEach((o: any) => {
          ; (o.items || []).forEach((it: any) => {
            const key = it.productName || it.product_name
            if (!key) return
            const prev = productMap.get(key) || { name: key, quantity: 0, revenue: 0 }
            productMap.set(key, {
              name: key,
              quantity: prev.quantity + Number(it.quantity ?? 0),
              revenue: prev.revenue + Number(it.lineTotal ?? it.line_total ?? 0),
            })
          })
        })
      const products = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
      setTopProducts(products)
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error loading reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleExportCsv = () => {
    if (!daily) return
    const rows = [
      ["Metric", "Value"],
      ["Date", daily.date],
      ["Orders", String(daily.orderCount)],
      ["Paid orders", String(daily.paidCount)],
      ["Total sales", daily.totalSales.toFixed(2)],
      ["Average ticket", daily.averageTicket.toFixed(2)],
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `daily-sales-${daily.date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} /> {/* ADD THIS */}
        <div className="py-8 px-4 sm:px-20"> {/* FIXED: Match other admin pages padding */}
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                  Reports
                </h1>
                <p className="text-sm text-amber-800/80">
                  Analyze sales performance and top products.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const v = e.target.value
                    setSelectedDate(v)
                    if (v) {
                      loadReports(v)
                    }
                  }}
                  className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Button
                  variant="outline"
                  onClick={handleExportCsv}
                  disabled={!daily}
                  className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50 text-xs sm:text-sm"
                >
                  Export daily CSV
                </Button>
              </div>
            </div>

            {loading && (
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-6 bg-amber-50 rounded-lg animate-pulse" />
                <div className="h-24 bg-amber-50 rounded-lg animate-pulse" />
                <div className="h-24 bg-amber-50 rounded-lg animate-pulse" />
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-amber-900 mb-2">
                      Daily sales
                    </h2>
                    {daily ? (
                      <div className="space-y-1 text-sm text-amber-900">
                        <p>
                          Date:{" "}
                          <span className="font-semibold">
                            {format(new Date(daily.date), "yyyy-MM-dd")}
                          </span>
                        </p>
                        <p>
                          Orders:{" "}
                          <span className="font-semibold">
                            {daily.orderCount}
                          </span>
                        </p>
                        <p>
                          Paid orders:{" "}
                          <span className="font-semibold">
                            {daily.paidCount}
                          </span>
                        </p>
                        <p>
                          Total sales:{" "}
                          <span className="font-semibold">
                            ${daily.totalSales.toFixed(2)}
                          </span>
                        </p>
                        <p>
                          Average ticket:{" "}
                          <span className="font-semibold">
                            ${daily.averageTicket.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-800/80">
                        No daily data for this date.
                      </p>
                    )}
                  </div>

                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-amber-900 mb-2">
                      Monthly sales
                    </h2>
                    {monthly ? (
                      <div className="space-y-1 text-sm text-amber-900">
                        <p>
                          Period:{" "}
                          <span className="font-semibold">
                            {monthly.year}-{String(monthly.month).padStart(2, "0")}
                          </span>
                        </p>
                        <p>
                          Orders:{" "}
                          <span className="font-semibold">
                            {monthly.orderCount}
                          </span>
                        </p>
                        <p>
                          Paid orders:{" "}
                          <span className="font-semibold">
                            {monthly.paidCount}
                          </span>
                        </p>
                        <p>
                          Total sales:{" "}
                          <span className="font-semibold">
                            ${monthly.totalSales.toFixed(2)}
                          </span>
                        </p>
                        <p>
                          Average ticket:{" "}
                          <span className="font-semibold">
                            ${monthly.averageTicket.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-800/80">
                        No monthly data for this period.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-amber-900 mb-3">
                    Top products (today)
                  </h2>
                  {topProducts.length ? (
                    <div className="space-y-2 text-sm">
                      {topProducts.map((p) => (
                        <div
                          key={p.name}
                          className="flex items-center justify-between border-b border-amber-50 py-2 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-amber-900">
                              {p.name}
                            </p>
                            <p className="text-xs text-amber-800/80">
                              {p.quantity} sold
                            </p>
                          </div>
                          <p className="font-semibold text-amber-900">
                            ${p.revenue.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-800/80">
                      No product data for this date.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}