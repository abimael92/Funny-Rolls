"use client"

import React from "react"
import { Calculator, ChefHat, BarChart3 } from "lucide-react"

interface MobileViewSwitcherProps {
    mobileView: 'ingredients' | 'calculator' | 'production'
    setMobileView: (view: 'ingredients' | 'calculator' | 'production') => void
}

export function MobileViewSwitcher({ mobileView, setMobileView }: MobileViewSwitcherProps) {

    // Handle keyboard navigation
    const handleKeyPress = (event: React.KeyboardEvent, view: 'ingredients' | 'calculator' | 'production') => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setMobileView(view)
        }
    }

    // ARIA labels for accessibility
    const getAriaLabel = (view: string, isActive: boolean) => {
        return `${view} ${isActive ? 'selected' : ''}. Click to switch to ${view} view`
    }

    return (
        <div className="lg:hidden flex border border-amber-300 bg-white sticky top-0 z-10 mb-6 rounded-xl shadow-lg mt-4 mx-auto w-[95%] overflow-hidden"
            role="tablist"
            aria-label="Mobile navigation tabs">

            <button
                role="tab"
                onClick={() => setMobileView('calculator')}
                onKeyDown={(e) => handleKeyPress(e, 'calculator')}
                aria-selected={mobileView === 'calculator'}
                aria-label={getAriaLabel('Calculator', mobileView === 'calculator')}
                tabIndex={mobileView === 'calculator' ? 0 : -1}
                className={`flex-1 py-4 px-3 text-center font-medium flex items-center justify-center gap-2 transition-all duration-200 ${mobileView === 'calculator'
                    ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-amber-600 hover:bg-amber-25 active:bg-amber-100'
                    }`}
            >
                <ChefHat className="h-4 w-4" aria-hidden="true" />
                <span>Calculadora</span>
            </button>

            <div className="flex-shrink-0 w-px bg-amber-300 my-2"></div>

            <button
                role="tab"
                onClick={() => setMobileView('ingredients')}
                onKeyDown={(e) => handleKeyPress(e, 'ingredients')}
                aria-selected={mobileView === 'ingredients'}
                aria-label={getAriaLabel('Ingredients', mobileView === 'ingredients')}
                tabIndex={mobileView === 'ingredients' ? 0 : -1}
                className={`flex-1 py-4 px-3 text-center font-medium flex items-center justify-center gap-2 transition-all duration-200 ${mobileView === 'ingredients'
                    ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-amber-600 hover:bg-amber-25'
                    }`}
            >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                <span>Ingredientes</span>
            </button>

            <div className="flex-shrink-0 w-px bg-amber-300 my-2"></div>

            <button
                role="tab"
                onClick={() => setMobileView('production')}
                onKeyDown={(e) => handleKeyPress(e, 'production')}
                aria-selected={mobileView === 'production'}
                aria-label={getAriaLabel('Production', mobileView === 'production')}
                tabIndex={mobileView === 'production' ? 0 : -1}
                className={`flex-1 py-4 px-3 text-center font-medium flex items-center justify-center gap-2 transition-all duration-200 ${mobileView === 'production'
                    ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-amber-600 hover:bg-amber-25'
                    }`}
            >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                <span>Producción</span>
            </button>
        </div>
    )
}