"use client"

import { Calculator, ChefHat } from "lucide-react"

interface MobileViewSwitcherProps {
    mobileView: 'ingredients' | 'calculator'
    setMobileView: (view: 'ingredients' | 'calculator') => void
}

export function MobileViewSwitcher({ mobileView, setMobileView }: MobileViewSwitcherProps) {
    return (
        <div className="lg:hidden flex border-b border-amber-200 bg-white sticky top-0 z-10 mb-6 shadow-sm">
            <button
                onClick={() => setMobileView('calculator')}
                className={`flex-1 py-4 text-center font-medium flex items-center justify-center gap-2 transition-all duration-200 ${mobileView === 'calculator'
                    ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-amber-600 hover:bg-amber-25'
                    }`}
            >
                <ChefHat className="h-4 w-4" />
                <span>Calculadora</span>
            </button>
            <button
                onClick={() => setMobileView('ingredients')}
                className={`flex-1 py-4 text-center font-medium flex items-center justify-center gap-2 transition-all duration-200 ${mobileView === 'ingredients'
                    ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-amber-600 hover:bg-amber-25'
                    }`}
            >
                <Calculator className="h-4 w-4" />
                <span>Ingredientes</span>
            </button>
        </div>
    )
}