"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Menu, X } from "lucide-react"

interface NavbarProps {
  cart: any[]
  onCartOpen: () => void
}

export function Navbar({ cart, onCartOpen }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* <h1 className="font-cursive text-3xl text-[#8B4513]">Funny Rolls</h1> */}

         {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full flex items-center justify-center">
            <i className="ri-cake-3-line text-amber-700 text-xl"></i>
          </div>
          <span className="font-['Pacifico'] text-2xl text-amber-800">Funny Rolls</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
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

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
        <Button
            onClick={onCartOpen}
            className="relative bg-amber-600 hover:bg-amber-700 text-white rounded-full px-3 py-2 flex items-center gap-1"
          >
            <ShoppingCart className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#C48A6A]/20 animate-scale-in">
          <div className="px-4 py-3 flex flex-col space-y-2">
            <a href="#home" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">Home</a>
            <a href="#menu" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">Menu</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">About</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">Contact</a>
          </div>
        </div>
      )}
    </nav>
  )
}
