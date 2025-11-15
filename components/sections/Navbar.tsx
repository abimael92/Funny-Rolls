"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CartItem } from "@/lib/types"
import { ShoppingCart, Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface NavbarProps {
  cart: CartItem[]
  onCartOpen: () => void
}

export function Navbar({ cart, onCartOpen }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isHomePage = pathname === "/"

  // Handle navigation with proper scrolling - FIXED
  const handleNavigation = (hash: string) => {
    if (isHomePage) {
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      setIsMenuOpen(false)
    } else {
      // Navigate to home page with hash
      router.push(`/${hash}`) // This should be just the hash, not preceded by slash
    }
  }

  return (
    <nav className="sticky top-0 left-0 w-full bg-amber-100 z-50
                    shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.05)]
                    border-b-8 border-amber-900/80">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between relative min-h-[120px]">

        {/* Logo Left */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center">
          <Link href="/">
            <Image
              src="/img/title.png"
              alt="Logo Funny Rolls"
              width={100}
              height={100}
              className="object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* Title Center (hidden on mobile) */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-800 font-['Pacifico'] text-3xl select-none pointer-events-none">
          Funny Rolls
        </div>

        {/* Desktop Menu Right */}
        <div className="hidden md:flex flex-col items-end gap-2 absolute right-6 top-1/2 -translate-y-1/2">

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

          <div className="group ml-4 relative">
            <div className="flex items-center gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
              <button
                onClick={() => handleNavigation('#home')}
                className="text-warm-brown hover:text-amber-600 transition-colors"
              >
                Inicio
              </button>
              <div className="w-px h-4 bg-amber-800/50"></div>

              <button
                onClick={() => handleNavigation('#menu')}
                className="text-warm-brown hover:text-amber-600 transition-colors"
              >
                Menú
              </button>
              <div className="w-px h-4 bg-amber-800/50"></div>

              <button
                onClick={() => handleNavigation('#about')}
                className="text-warm-brown hover:text-amber-600 transition-colors"
              >
                Acerca de
              </button>
              <div className="w-px h-4 bg-amber-800/50"></div>

              <button
                onClick={() => handleNavigation('#contact')}
                className="text-warm-brown hover:text-amber-600 transition-colors"
              >
                Contacto
              </button>
              <div className="w-px h-4 bg-amber-800/50"></div>

              <Link
                href="/recipe-calculator"
                className="text-warm-brown hover:text-amber-600 transition-colors"
              >
                Calculadora
              </Link>
            </div>
          </div>


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
        <div className="md:hidden bg-[#C48A6A]/20 border-t border-[#C48A6A]/20 animate-scale-in">
          <div className="px-4 py-1.5 flex flex-col">
            <button
              onClick={() => handleNavigation('#home')}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Inicio
            </button>
            <button
              onClick={() => handleNavigation('#menu')}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Menú
            </button>
            <button
              onClick={() => handleNavigation('#about')}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Acerca de
            </button>
            <button
              onClick={() => handleNavigation('#contact')}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Contacto
            </button>
            <Link
              href="/recipe-calculator"
              onClick={() => setIsMenuOpen(false)}
              className="text-warm-brown transition-colors py-1 text-left"
            >
              Calculadora
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}