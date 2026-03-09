"use client"

import { useEffect, useState, useCallback } from "react"
import { Product, CartItem } from "@/lib/types"
import { getProducts, getCartTotals, startCheckout, completePayment, getDailySalesSummary } from "@/lib/services"
import { createOrderApi, completeOrderApi } from "@/lib/order-api"
import { Hero } from "@/components/sections/Hero"
import { Navbar } from "@/components/Navbar"
import { MenuSection } from "@/components/sections/MenuSection"
import { About } from "@/components/sections/About"
import { Contact } from "@/components/sections/Contact"
import { Footer } from "@/components/sections/Footer"
import { CartModal } from "@/components/sections/CartModal"
import { DailySalesSummaryModal } from "@/components/sections/DailySalesSummaryModal"
import { supabase } from "@/lib/supabase"

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export default function FunnyRollsPage() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null)
  const [checkoutOrderNumber, setCheckoutOrderNumber] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) => prev.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    ))
  }

  const cartTotals = getCartTotals(cart)

  const handleStartCheckout = useCallback(async (notes?: string) => {
    if (cart.length === 0) return null
    const apiOrder = await createOrderApi(cart, { notes })
    if (apiOrder) {
      setCheckoutOrderId(apiOrder.id)
      setCheckoutOrderNumber(apiOrder.order_number)
      return { orderId: apiOrder.id, orderNumber: apiOrder.order_number, alreadyPaid: false, paymentStatus: "initiated" as const }
    }
    const result = startCheckout(cart)
    setCheckoutOrderId(result.orderId)
    setCheckoutOrderNumber(null)
    return { ...result, orderNumber: null }
  }, [cart])

  const handleCompleteSale = useCallback(async (orderId: string, payload: Parameters<typeof completePayment>[1]) => {
    if (isUuid(orderId)) {
      const ok = await completeOrderApi(orderId, {
        paymentMethod: payload.paymentMethod,
        amountReceived: payload.amountReceived,
        changeDue: payload.changeDue,
      })
      if (ok) {
        setCart([])
        setCheckoutOrderId(null)
        setCheckoutOrderNumber(null)
        setIsCartOpen(false)
        return
      }
    }
    completePayment(orderId, payload)
    setCart([])
    setCheckoutOrderId(null)
    setCheckoutOrderNumber(null)
    setIsCartOpen(false)
  }, [])

  // Combine with existing products (single source of truth via services)
  const allProducts = [...getProducts(), ...dbProducts]

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase.from('recipes').select('*')
      if (data) {
        const recipeProducts = data.map(recipe => ({
          id: parseInt(recipe.id.replace('recipe-', '')) || Date.now(),
          name: recipe.name,
          price: recipe.selling_price,
          image: recipe.image || "/placeholder.svg",
          description: `Receta especial - ${recipe.batch_size} unidades`,
          rating: 4.5,
          available: recipe.available,
          recipe: recipe
        }))
        setDbProducts(recipeProducts)
      }
    }
    fetchRecipes()
  }, [])

  return (
    <div className="min-h-screen bg-[#FFF5E6]">
      <Navbar
        cart={cart}
        onCartOpen={() => setIsCartOpen(true)}
        onSalesSummaryOpen={() => setIsSummaryOpen(true)}
      />
      <Hero />
      <MenuSection products={allProducts} addToCart={addToCart} />
      <About />
      <Contact />
      <Footer />
      <CartModal
        isOpen={isCartOpen}
        onClose={() => { setIsCartOpen(false); setCheckoutOrderId(null); setCheckoutOrderNumber(null) }}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        subtotal={cartTotals.subtotal}
        tax={cartTotals.tax}
        total={cartTotals.total}
        checkoutOrderId={checkoutOrderId}
        checkoutOrderNumber={checkoutOrderNumber}
        onStartCheckout={handleStartCheckout}
        onCompleteSale={handleCompleteSale}
      />
      <DailySalesSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={getDailySalesSummary()}
      />
    </div>
  )
}
