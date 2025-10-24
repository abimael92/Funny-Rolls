"use client"

interface MobileViewSwitcherProps {
    mobileView: 'ingredients' | 'calculator'
    setMobileView: (view: 'ingredients' | 'calculator') => void
}

export function MobileViewSwitcher({ mobileView, setMobileView }: MobileViewSwitcherProps) {
    return (
        <div className="lg:hidden flex border-b border-amber-200 mb-6">
            <button
                onClick={() => setMobileView('calculator')}
                className={`flex-1 py-3 text-center font-medium ${mobileView === 'calculator' ? 'text-amber-700 border-b-2 border-amber-600' : 'text-gray-500'}`}
            >
                Calculadora
            </button>
            <button
                onClick={() => setMobileView('ingredients')}
                className={`flex-1 py-3 text-center font-medium ${mobileView === 'ingredients' ? 'text-amber-700 border-b-2 border-amber-600' : 'text-gray-500'}`}
            >
                Ingredientes
            </button>
        </div>
    )
}