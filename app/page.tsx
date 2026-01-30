"use client"

import { useEffect, useState } from "react"
import { Product, CartItem } from "@/lib/types"
import { getProducts, getCartTotals, createOrderFromCart, getDailySalesSummary } from "@/lib/services"
import { Hero } from "@/components/sections/Hero"
import { Navbar } from "@/components/sections/Navbar"
import { MenuSection } from "@/components/sections/MenuSection"
import { About } from "@/components/sections/About"
import { Contact } from "@/components/sections/Contact"
import { Footer } from "@/components/sections/Footer"
import { CartModal } from "@/components/sections/CartModal"
import { DailySalesSummaryModal } from "@/components/sections/DailySalesSummaryModal"
import { supabase } from "@/lib/supabase"

export default function FunnyRollsPage() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
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

  const getTotalPrice = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0)
    


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
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        totalPrice={getTotalPrice()}
      />
    </div>
  )
}
