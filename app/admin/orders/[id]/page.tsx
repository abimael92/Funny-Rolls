"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ProtectedContent from "@/components/ProtectedContent"

type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "completed" | "cancelled"

interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface OrderDetail {
  id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  tax: number
  total: number
  notes?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  customer_email?: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
}

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const orderId = params?.id

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const loadOrder = async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Error loading order")
      }
      const data = await res.json()
      setOrder(data)
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error loading order")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const setStatus = async (status: OrderStatus) => {
    if (!orderId) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Error updating status")
      }
      await loadOrder()
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error updating status")
    } finally {
      setUpdating(false)
    }
  }

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

  const nextStatuses =
    order?.status === "cancelled" || order?.status === "completed"
      ? []
      : STATUS_FLOW.filter((s) => s !== order?.status && s !== "pending")

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6] py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs text-amber-700/80 mb-1">
                <Link href="/admin/orders" className="hover:underline">
                  Orders
                </Link>{" "}
                / {order?.order_number || orderId}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                Order {order?.order_number || ""}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1">
              {order && (
                <>
                  <div>{getStatusBadge(order.status)}</div>
                  <p className="text-xs text-amber-800/80">
                    Created{" "}
                    {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
                  </p>
                </>
              )}
            </div>
          </div>

          {loading && (
            <div className="bg-white/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="h-6 bg-amber-50 rounded-lg animate-pulse" />
              <div className="h-6 bg-amber-50 rounded-lg animate-pulse" />
              <div className="h-32 bg-amber-50 rounded-lg animate-pulse" />
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && order && (
            <>
              {/* Summary */}
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-amber-900 mb-2">
                    Customer
                  </h2>
                  <p className="text-sm text-amber-900">
                    {order.customer_name || "Walk-in"}
                  </p>
                  {order.customer_phone && (
                    <p className="text-xs text-amber-800/80 mt-1">
                      Phone: {order.customer_phone}
                    </p>
                  )}
                  {order.customer_email && (
                    <p className="text-xs text-amber-800/80">
                      Email: {order.customer_email}
                    </p>
                  )}
                </div>
                <div className="md:text-right">
                  <h2 className="text-sm font-semibold text-amber-900 mb-2">
                    Payment
                  </h2>
                  <p className="text-xs text-amber-800/80">
                    Subtotal: ${order.subtotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-amber-800/80">
                    Tax: ${order.tax.toFixed(2)}
                  </p>
                  <p className="text-lg font-bold text-amber-900 mt-1">
                    Total: ${order.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-amber-900 mb-3">
                  Items
                </h2>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-amber-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-amber-800/80">
                          {item.quantity} x ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-amber-900">
                        ${item.lineTotal.toFixed(2)}
                      </p>
                    </div>
                  ))}

                  {!order.items.length && (
                    <p className="text-sm text-amber-800/80">
                      No items found for this order.
                    </p>
                  )}
                </div>
              </div>

              {/* Notes + actions */}
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-4">
                {order.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900 mb-1">
                      Notes
                    </h3>
                    <p className="text-sm text-amber-800/90 whitespace-pre-wrap">
                      {order.notes}
                    </p>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        disabled={updating}
                        onClick={() => setStatus(s)}
                        className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-50"
                      >
                        Set {s}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/receipts/${order.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-amber-300 px-4 py-2 text-xs sm:text-sm font-medium text-amber-900 hover:bg-amber-50"
                    >
                      View receipt
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedContent>
  )
}

