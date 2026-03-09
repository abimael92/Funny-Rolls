"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CartItem } from "@/lib/types"
import {
  ShoppingCart,
  Menu,
  X,
  BarChart3,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  LayoutDashboard,
  Calculator,
  ClipboardList,
  Package,
  ChefHat,
  BarChart2,
  Users,
  Settings
} from "lucide-react"
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
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const isHomePage = pathname === "/"
  const isLoggedIn = !!user
  const isAdmin = user?.role === "admin"

  const handleNavigation = (hash: string) => {
    if (isHomePage) {
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
      setIsMenuOpen(false)
    } else {
      router.push(`/${hash}`)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Force hard redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/'
    }
  }

  return (
    <nav
      className="sticky top-0 left-0 w-full bg-amber-100 z-50
                    shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.05)]
                    border-b-8 border-amber-900/80"
    >
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

        {/* Desktop Right Side */}
        <div className="hidden md:flex flex-col items-end gap-2 ml-auto mt-5">

          {/* TOP ROW - Admin Menu (when logged in) OR Cart/Login (when logged out) */}
          <div className="flex items-center justify-end gap-4 w-full">
            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
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
                <Link
                  href="/login"
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:text-[#C48A6A] transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsAdminMenuOpen((open) => !open)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    {user.email?.split("@")[0]} ({user.role})
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-amber-200 py-2 z-50">
                    <div className="px-4 pb-2 text-xs text-gray-500">
                      Menú administrativo
                    </div>
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 text-amber-700" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/admin/calculator"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      <Calculator className="h-4 w-4 text-amber-700" />
                      <span>Calculator</span>
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      <ClipboardList className="h-4 w-4 text-amber-700" />
                      <span>Orders</span>
                    </Link>
                    <Link
                      href="/admin/inventory"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      <Package className="h-4 w-4 text-amber-700" />
                      <span>Inventory</span>
                    </Link>
                    <Link
                      href="/admin/production"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      <ChefHat className="h-4 w-4 text-amber-700" />
                      <span>Production</span>
                    </Link>
                    <Link
                      href="/admin/reports"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      <BarChart2 className="h-4 w-4 text-amber-700" />
                      <span>Reports</span>
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin/users"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                          onClick={() => setIsAdminMenuOpen(false)}
                        >
                          <Users className="h-4 w-4 text-amber-700" />
                          <span>Users</span>
                        </Link>
                        <Link
                          href="/admin/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                          onClick={() => setIsAdminMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 text-amber-700" />
                          <span>Settings</span>
                        </Link>
                      </>
                    )}
                    <div className="my-2 border-t border-amber-100" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* {onSalesSummaryOpen != null && (
              <Button
                variant="outline"
                onClick={onSalesSummaryOpen}
                className="rounded-full px-4 py-2 flex items-center gap-2 border-amber-700 text-amber-800 hover:bg-amber-50"
              >
                <BarChart3 className="w-4 h-4" />
                Resumen
              </Button>
            )} */}
          </div>

          {/* BOTTOM ROW - Main navigation (Inicio, Menú, Acerca de, Contacto) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigation("#home")}
              className="text-warm-brown hover:text-amber-600 transition-colors"
            >
              Inicio
            </button>
            <div className="w-px h-4 bg-amber-800/50" />
            <button
              onClick={() => handleNavigation("#menu")}
              className="text-warm-brown hover:text-amber-600 transition-colors"
            >
              Menú
            </button>
            <div className="w-px h-4 bg-amber-800/50" />
            <button
              onClick={() => handleNavigation("#about")}
              className="text-warm-brown hover:text-amber-600 transition-colors"
            >
              Acerca de
            </button>
            <div className="w-px h-4 bg-amber-800/50" />
            <button
              onClick={() => handleNavigation("#contact")}
              className="text-warm-brown hover:text-amber-600 transition-colors"
            >
              Contacto
            </button>
          </div>
        </div>

        {/* Mobile Right Side */}
        <div className="md:hidden flex items-center gap-2 absolute right-6 top-1/2 -translate-y-1/2">
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

          {!isLoggedIn ? (
            <>
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
              <Link
                href="/login"
                className="p-2 text-gray-700 hover:text-[#C48A6A]"
                aria-label="Login"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            </>
          ) : (
            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <User className="w-4 h-4" />
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen((open) => !open)}
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
              onClick={() => handleNavigation("#home")}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Inicio
            </button>
            <button
              onClick={() => handleNavigation("#menu")}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Menú
            </button>
            <button
              onClick={() => handleNavigation("#about")}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Acerca de
            </button>
            <button
              onClick={() => handleNavigation("#contact")}
              className="text-warm-brown py-1 border-b transition-colors border-[#C48A6A]/30 text-left"
            >
              Contacto
            </button>

            {isLoggedIn ? (
              <>
                <div className="mt-2 pt-2 border-t border-[#C48A6A]/30 text-xs text-gray-500">
                  Menú administrativo
                </div>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/calculator"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Calculator</span>
                </Link>
                <Link
                  href="/admin/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/admin/inventory"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                >
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </Link>
                <Link
                  href="/admin/production"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>Production</span>
                </Link>
                <Link
                  href="/admin/reports"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                >
                  <BarChart2 className="h-4 w-4" />
                  <span>Reports</span>
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/users"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                    >
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 py-1 border-b border-[#C48A6A]/30 text-warm-brown"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="mt-1 flex items-center gap-2 py-1 text-red-600 text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  )
}

