"use client"

import { Button } from "@/components/ui/button"
import type { DailySalesSummary } from "@/lib/services"

export function DailySalesSummaryModal({
  isOpen,
  onClose,
  summary,
}: {
  isOpen: boolean
  onClose: () => void
  summary: DailySalesSummary
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Ventas de hoy</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <span className="text-gray-600">Pedidos</span>
            <span className="font-semibold">{summary.orderCount}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <span className="text-gray-600">Ventas totales</span>
            <span className="font-semibold">${summary.totalSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Ticket promedio</span>
            <span className="font-semibold">${summary.averageTicket.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose} className="min-h-11 px-5">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
