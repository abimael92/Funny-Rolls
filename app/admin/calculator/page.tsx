"use client"

import { useState } from "react"
import { RecipeCalculator } from "@/components/RecipeCalculator/RecipeCalculator"
import { Navbar } from "@/components/Navbar"
import ProtectedContent from "@/components/ProtectedContent"

export default function AdminCalculatorPage() {
  const [cart] = useState([]) // Empty cart for this admin page

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} />
        <div className="py-8">
          <div className="mx-auto px-4 sm:px-20">
            <RecipeCalculator />
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}

