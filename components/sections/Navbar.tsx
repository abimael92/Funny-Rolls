"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CartItem } from "@/lib/types"
import { ShoppingCart, Menu, X } from "lucide-react"
import Image from "next/image"

interface NavbarProps {
  cart: CartItem[]
  onCartOpen: () => void
}

export function Navbar({ cart, onCartOpen }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-8xl mx-auto px-6 py-8 flex items-center justify-between relative min-h-[90px]">

        {/* Logo Left */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center">
          <Image
            src="/img/title.png"
            alt="Logo Funny Rolls"
            width={110}
            height={110}
            className="object-contain"
          />
        </div>

        {/* Title Center (hidden on mobile) */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-800 font-['Pacifico'] text-4xl select-none pointer-events-none">
          Funny Rolls
        </div>

        {/* Desktop Menu Right */}
        <div className="hidden md:flex items-center gap-6 absolute right-6 top-1/2 -translate-y-1/2">
          <a href="#home" className="hover:text-amber-600 transition-colors">Inicio</a>
          <a href="#menu" className="hover:text-amber-600 transition-colors">Menú</a>
          <a href="#about" className="hover:text-amber-600 transition-colors">Acerca de</a>
          <a href="#contact" className="hover:text-amber-600 transition-colors">Contacto</a>
          <a href="/recipe-calculator" className="hover:text-amber-600 transition-colors">Calculadora</a>
          <Button
            onClick={onCartOpen}
            className="relative bg-amber-600 hover:bg-amber-700 text-white rounded-full px-4 py-2 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Carrito
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile Menu Right */}
        <div className="md:hidden flex items-center gap-2 absolute right-6 top-1/2 -translate-y-1/2">
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
            <a href="#home" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">Inicio</a>
            <a href="#menu" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">Menú</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">Acerca de</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-600 transition-colors">Contacto</a>
          </div>
        </div>
      )}
    </nav>
  )
}
