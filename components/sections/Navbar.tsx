"use client"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

interface NavbarProps {
  cart: any[]
  onCartOpen: () => void
}

export function Navbar({ cart, onCartOpen }: NavbarProps) {
  return (
    <nav className="sticky top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="font-cursive text-3xl text-[#8B4513]">Funny Rolls</h1>

        <div className="flex items-center gap-6">
          <a href="#home" className="hover:text-amber-600 transition-colors">Home</a>
          <a href="#menu" className="hover:text-amber-600 transition-colors">Menu</a>
          <a href="#about" className="hover:text-amber-600 transition-colors">About</a>
          <a href="#contact" className="hover:text-amber-600 transition-colors">Contact</a>

          <Button
            onClick={onCartOpen}
            className="relative bg-amber-600 hover:bg-amber-700 text-white rounded-full px-4 py-2 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </nav>
  )
}
