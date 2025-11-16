"use client"

import { useState } from "react"
import { RecipeCalculator } from "@/components/sections/RecipeCalculator"
import { Navbar } from "@/components/sections/Navbar"

export default function RecipeCalculatorPage() {
    const [cart] = useState([]) // Empty cart for this page

    return (
        <div className="min-h-screen bg-[#FFF5E6]">
            <Navbar cart={cart} onCartOpen={() => { }} />
            <div className="py-8">
                <div className="mx-auto px-4 sm:px-20">
                    <RecipeCalculator />
                </div>
            </div>
        </div>
    )
}