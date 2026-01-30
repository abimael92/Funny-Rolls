"use client"
import { Button } from "@/components/ui/button"
import { CartItem } from "@/lib/types"

export function CartModal({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  subtotal,
  tax,
  total,
  onPay,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  updateQuantity: (id: number, qty: number) => void
  removeFromCart: (id: number) => void
  subtotal: number
  tax: number
  total: number
  onPay: () => void
}) {
  if (!isOpen) return null

  const handlePay = () => {
    if (cart.length === 0) return
    onPay()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Tu Carrito</h2>
        {cart.length === 0 ? (
          <p className="text-gray-600">Tu carrito está vacío.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                  <span>{item.quantity}</span>
                  <Button variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                  <Button variant="destructive" onClick={() => removeFromCart(item.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
            <div className="text-right space-y-1">
              <div className="text-gray-600">Subtotal: ${subtotal.toFixed(2)}</div>
              <div className="text-gray-600">Impuesto: ${tax.toFixed(2)}</div>
              <div className="font-bold text-lg">Total: ${total.toFixed(2)}</div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handlePay}
            disabled={cart.length === 0}
          >
            Pagar
          </Button>
        </div>
      </div>
    </div>
  )
}
