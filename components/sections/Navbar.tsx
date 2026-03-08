"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CartItem } from "@/lib/types"
import { ShoppingCart, Menu, X, BarChart3, LogIn, LogOut, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"

interface NavbarProps {
  cart: CartItem[]
  onCartOpen: () => void
  onSalesSummaryOpen?: () => void
}

export function Navbar({ cart, onCartOpen, onSalesSummaryOpen }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

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
      router.push(`/${hash}`)
    }
  }

  return (
    <nav className="sticky top-0 left-0 w-full bg-amber-100 z-50
                    shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.05)]
                    border-b-8 border-amber-900/80">

      <div className="w-full flex items-center justify-between relative min-h-[100px] px-8">

        {/* Logo Left */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/">
            <Image
              src="/img/title.png"
              alt="Logo Funny Rolls"
              width={160}
              height={160}
              className="object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* Title Center (hidden on mobile) */}
        <div className="hidden md:block flex-1 text-center px-4">
          <div className="hidden md:block absolute px-2 mx-2 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-800 font-['Pacifico'] text-5xl select-none pointer-events-none">
            Funny Rolls
          </div>
        </div>

        {/* Desktop Menu Right */}
        <div className="hidden md:flex flex-col items-end gap-2 ml-auto mt-5">

          {onSalesSummaryOpen != null && (
            <Button
              variant="outline"
              onClick={onSalesSummaryOpen}
              className="rounded-full px-4 py-2 flex items-center gap-2 border-amber-700 text-amber-800 hover:bg-amber-50"
            >
              <BarChart3 className="w-4 h-4" />
              Resumen
            </Button>
          )}

          {/* Auth buttons for desktop */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {user.email?.split('@')[0]} ({user.role})
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:text-[#C48A6A] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:text-[#C48A6A] transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>

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

          <div className="flex items-center gap-2">
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

            {/* Kitchen link for staff/admin */}
            {user && (user.role === 'admin' || user.role === 'manager' || user.role === 'staff') && (
              <>
                <div className="w-px h-4 bg-amber-800/50"></div>
                <Link
                  href="/kitchen"
                  className="text-warm-brown hover:text-amber-600 transition-colors"
                >
                  Cocina
                </Link>
              </>
            )}

            {/* Admin link for admin/manager only */}
            {user && (user.role === 'admin' || user.role === 'manager') && (
              <>
                <div className="w-px h-4 bg-amber-800/50"></div>
                <Link
                  href="/admin/dashboard"
                  className="text-amber-700 font-semibold hover:text-amber-600 transition-colors"
                >
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Right */}
        <div className="md:hidden flex items-center gap-2 absolute right-6 top-1/2 -translate-y-1/2">

          {/* Auth button for mobile */}
          {user ? (
            <button
              onClick={signOut}
              className="p-2 text-gray-700 hover:text-[#C48A6A]"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/login"
              className="p-2 text-gray-700 hover:text-[#C48A6A]"
              aria-label="Login"
            >
              <LogIn className="w-5 h-5" />
            </Link>
          )}

          {onSalesSummaryOpen != null && (
            <Button
              variant="outline"
              size="icon"
              onClick={onSalesSummaryOpen}
              className="rounded-full border-amber-700 text-amber-800 hover:bg-amber-50"
              aria-label="Resumen ventas"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
          )}
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
              className="text-warm-brown transition-colors py-1 border-b border-[#C48A6A]/30 text-left"
            >
              Calculadora
            </Link>

            {/* Kitchen link for mobile */}
            {user && (user.role === 'admin' || user.role === 'manager' || user.role === 'staff') && (
              <Link
                href="/kitchen"
                onClick={() => setIsMenuOpen(false)}
                className="text-warm-brown transition-colors py-1 border-b border-[#C48A6A]/30 text-left"
              >
                Cocina
              </Link>
            )}

            {/* Admin link for mobile */}
            {user && (user.role === 'admin' || user.role === 'manager') && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="text-amber-700 font-semibold transition-colors py-1 text-left"
              >
                Admin Panel
              </Link>
            )}

            {/* User info in mobile menu */}
            {user && (
              <div className="mt-2 pt-2 border-t border-[#C48A6A]/30 text-sm text-gray-600">
                <span className="block">👤 {user.email}</span>
                <span className="block text-xs mt-1">Rol: {user.role}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}