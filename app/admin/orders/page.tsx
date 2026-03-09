"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
// import { format } from "date-fns" // REMOVE THIS - not used
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ProtectedContent from "@/components/ProtectedContent"
import { Navbar } from "@/components/Navbar"

// Install date-fns if you want to use it:
// pnpm add date-fns

type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "completed" | "cancelled"

interface Order {
  id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  tax: number
  total: number
  created_at: string
  customer_name: string | null
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart] = useState([]) // Empty cart for admin

  // Fix: Add null check for searchParams
  const status = (searchParams?.get("status") as OrderStatus | null) ?? "paid"
  const dateFrom = searchParams?.get("dateFrom") ?? ""
  const dateTo = searchParams?.get("dateTo") ?? ""

  const setFilter = (key: string, value: string) => {
    if (!searchParams) return // Add null check
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/orders?${params.toString()}`)
  }

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        if (status) qs.set("status", status)
        if (dateFrom) qs.set("dateFrom", dateFrom)
        if (dateTo) qs.set("dateTo", dateTo)
        const res = await fetch(`/api/orders/history?${qs.toString()}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Error loading orders")
        }
        const data = await res.json()
        setOrders(data.orders || [])
      } catch (e: any) {
        console.error(e)
        setError(e.message || "Error loading orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [status, dateFrom, dateTo])

  const statusOptions: { value: OrderStatus | ""; label: string }[] = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  const getStatusBadge = (s: OrderStatus) => {
    const variants: Record<OrderStatus, { className: string; label: string }> = {
      pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending" },
      paid: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Paid" },
      preparing: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "Preparing" },
      ready: { className: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Ready" },
      completed: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Completed" },
      cancelled: { className: "bg-red-100 text-red-800 border-red-200", label: "Cancelled" },
    }
    const v = variants[s]
    return <Badge className={`rounded-full px-2 py-0.5 text-xs border ${v.className}`}>{v.label}</Badge>
  }

  const totalAmount = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
    [orders]
  )

  // Format date without date-fns
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} />
        <div className="py-8 px-4 sm:px-20">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">Orders</h1>
                <p className="text-sm text-amber-800/80">
                  View and manage all customer orders.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-amber-700/70">Total Amount</p>
                  <p className="text-lg font-semibold text-amber-900">
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setFilter("status", e.target.value)}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setFilter("dateFrom", e.target.value)}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setFilter("dateTo", e.target.value)}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex-none">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push("/admin/orders")
                  }}
                  className="w-full rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white/90 border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
              {loading && (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-amber-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="p-6 text-sm text-red-700 bg-red-50 border-b border-red-100">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-amber-50 text-amber-900">
                        <th className="px-4 py-3 text-left font-semibold">Order</th>
                        <th className="px-4 py-3 text-left font-semibold">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Total</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-t border-amber-100 hover:bg-amber-50/70 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-amber-900">
                            {order.order_number}
                          </td>
                          <td className="px-4 py-3 text-amber-900/90">
                            {order.customer_name || "Walk-in"}
                          </td>
                          <td className="px-4 py-3 text-amber-900/80 whitespace-nowrap">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-amber-900">
                            ${order.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="text-xs sm:text-sm text-[#C48A6A] hover:text-[#B37959] font-semibold"
                            >
                              View details
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {!orders.length && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-amber-800/80"
                          >
                            No orders found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}