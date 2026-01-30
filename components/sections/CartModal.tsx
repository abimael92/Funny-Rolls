"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CartItem } from "@/lib/types"
import type { CreateOrderPayload } from "@/lib/services"

export function CartModal({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  subtotal,
  tax,
  total,
  onCompleteSale,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  updateQuantity: (id: number, qty: number) => void
  removeFromCart: (id: number) => void
  subtotal: number
  tax: number
  total: number
  onCompleteSale: (payload: CreateOrderPayload) => void
}) {
  const [step, setStep] = useState<"cart" | "payment">("cart")
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mock" | null>(null)
  const [amountReceived, setAmountReceived] = useState("")

  const resetPaymentStep = useCallback(() => {
    setStep("cart")
    setPaymentMethod(null)
    setAmountReceived("")
  }, [])

  const handleClose = useCallback(() => {
    resetPaymentStep()
    setNotes("")
    onClose()
  }, [onClose, resetPaymentStep])

  const goToPayment = () => {
    if (cart.length === 0) return
    setStep("payment")
  }

  const handleCashComplete = () => {
    const received = parseFloat(amountReceived) || 0
    if (received < total) return
    const changeDue = received - total
    onCompleteSale({
      notes: notes.trim() || undefined,
      paymentMethod: "cash",
      amountReceived: received,
      changeDue,
    })
    handleClose()
  }

  const handleMockComplete = () => {
    onCompleteSale({
      notes: notes.trim() || undefined,
      paymentMethod: "mock",
    })
    handleClose()
  }

  const receivedNum = parseFloat(amountReceived) || 0
  const changeDue = paymentMethod === "cash" ? Math.max(0, receivedNum - total) : 0
  const canCompleteCash = paymentMethod === "cash" && receivedNum >= total
  const insufficientCash = paymentMethod === "cash" && amountReceived !== "" && receivedNum > 0 && receivedNum < total

  if (!isOpen) return null

  const handlePay = () => {
    if (cart.length === 0) return
    onPay()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {step === "cart" ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Tu Carrito</h2>
            {cart.length === 0 ? (
              <p className="text-gray-600">Tu carrito está vacío.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</Button>
                      <span className="min-w-[1.5rem] text-center">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                      <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>Eliminar</Button>
                    </div>
                  </div>
                ))}

                {/* Order notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas del pedido (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: sin nuez, para mañana..."
                    rows={2}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Totals – clear separation, emphasize total due */}
                <div className="border-t border-gray-200 pt-3 space-y-1 text-right">
                  <div className="text-gray-600">Subtotal: ${subtotal.toFixed(2)}</div>
                  <div className="text-gray-600">Impuesto: ${tax.toFixed(2)}</div>
                  <div className="text-xl font-bold text-amber-800 mt-2">Total a pagar: ${total.toFixed(2)}</div>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} className="min-h-11 px-5">Cerrar</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white min-h-11 px-5" onClick={goToPayment} disabled={cart.length === 0}>
                Pagar
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Forma de pago</h2>

            {/* Total due – emphasized */}
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="text-sm text-amber-800 font-medium">Total a pagar</div>
              <div className="text-2xl font-bold text-amber-900">${total.toFixed(2)}</div>
            </div>

            {paymentMethod === null ? (
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full min-h-12 text-base bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => setPaymentMethod("cash")}
                >
                  Efectivo
                </Button>
                <Button
                  variant="outline"
                  className="w-full min-h-12 text-base"
                  onClick={() => setPaymentMethod("mock")}
                >
                  Completar venta (sin efectivo)
                </Button>
                <Button variant="ghost" className="w-full" onClick={resetPaymentStep}>
                  ← Volver al carrito
                </Button>
              </div>
            ) : paymentMethod === "cash" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto recibido</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full min-h-12 px-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    autoFocus
                  />
                </div>
                {insufficientCash && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    Monto insuficiente. Faltan ${(total - receivedNum).toFixed(2)}.
                  </div>
                )}
                {changeDue > 0 && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="text-sm text-green-800 font-medium">Cambio</div>
                    <div className="text-2xl font-bold text-green-900">${changeDue.toFixed(2)}</div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full min-h-12 text-base bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleCashComplete}
                    disabled={!canCompleteCash}
                  >
                    Completar venta
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setPaymentMethod(null); setAmountReceived(""); }}>
                    ← Otra forma de pago
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-right font-bold text-lg">Total: ${totalPrice.toFixed(2)}</div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">Pagar</Button>
        </div>
      </div>
    </div>
  )
}
