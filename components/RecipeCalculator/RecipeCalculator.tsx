"use client"

import { useState, useEffect } from "react"
import { products, defaultIngredients } from "@/lib/data"
import { Ingredient, InventoryItem, Recipe, ProductionRecord } from '@/lib/types'
import { MobileViewSwitcher } from './MobileViewSwitcher'
import { IngredientsPanel } from './IngredientsPanel'
import { RecipeCalculatorPanel } from './RecipeCalculatorPanel'
import { ProductionTrackerPanel } from './ProductionTrackerPanel'

export function RecipeCalculator() {
    // Ingredients management
    const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients)
    const [recipes, setRecipes] = useState<Recipe[]>(products.map(p => p.recipe))
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0])
    const [mobileView, setMobileView] = useState<'ingredients' | 'calculator' | 'production'>('calculator')
    const [productionHistory, setProductionHistory] = useState<ProductionRecord[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [error, setError] = useState<string | null>(null)

    // Safe localStorage functions
    const safeSetLocalStorage = (key: string, data: unknown) => {
        try {
            localStorage.setItem(key, JSON.stringify(data))
        } catch (err) {
            console.error(`Failed to save data. \n ${err}`);
            setError('Failed to save data. Storage might be full.')
        }
    }

    const safeGetLocalStorage = <T,>(key: string, fallback: T): T => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : fallback
        } catch (err) {
            console.error(`Failed to save data. \n ${err}`);
            setError('Failed to load saved data.')
            return fallback
        }
    }

    // Input validation
    const validateNumber = (value: string, min: number = 0, max: number = 10000): number => {
        const num = parseFloat(value)
        if (isNaN(num)) return min
        if (num < min) return min
        if (num > max) return max
        return Math.round(num * 100) / 100
    }

    // Load data from localStorage
    useEffect(() => {
        const savedIngredients = safeGetLocalStorage('recipe-calculator-ingredients', defaultIngredients)
        const savedRecipes = safeGetLocalStorage('recipe-calculator-recipes', products.map(p => p.recipe))
        const savedProductionHistory = safeGetLocalStorage('recipe-calculator-production-history', [])
        const savedInventory = safeGetLocalStorage('recipe-calculator-inventory', [])

        setIngredients(savedIngredients)

        const recipesWithSteps = savedRecipes.map((recipe: Recipe) => ({
            ...recipe,
            steps: recipe.steps || []
        }))
        setRecipes(recipesWithSteps)
        setSelectedRecipe(recipesWithSteps[0])

        setProductionHistory(savedProductionHistory)

        if (savedInventory.length > 0) {
            setInventory(savedInventory)
        } else {
            const initialInventory = defaultIngredients.map(ingredient => ({
                ingredientId: ingredient.id,
                currentStock: 0,
                unit: ingredient.unit,
                minimumStock: 0,
                lastUpdated: new Date().toISOString()
            }))
            setInventory(initialInventory)
        }
    }, [])

    // Save to localStorage with error handling
    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-ingredients', ingredients)
    }, [ingredients])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-recipes', recipes)
    }, [recipes])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-production-history', productionHistory)
    }, [productionHistory])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-inventory', inventory)
    }, [inventory])

    // Enhanced record production with validation
    const recordProduction = (recipeId: string, batchCount: number, date: Date = new Date()) => {
        setError(null)

        const validBatchCount = validateNumber(batchCount.toString(), 1, 1000)
        if (validBatchCount <= 0) {
            setError('Batch count must be at least 1')
            return
        }

        const recipe = recipes.find(r => r.id === recipeId)
        if (!recipe) {
            setError('Recipe not found')
            return
        }

        // Check inventory
        const lowStockIngredients: string[] = []
        recipe.ingredients.forEach(recipeIngredient => {
            const inventoryItem = inventory.find(item => item.ingredientId === recipeIngredient.ingredientId)
            const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId)
            const requiredAmount = recipeIngredient.amount * validBatchCount
            if (inventoryItem && inventoryItem.currentStock < requiredAmount && ingredient) {
                lowStockIngredients.push(ingredient.name)
            }
        })

        if (lowStockIngredients.length > 0) {
            setError(`Low stock: ${lowStockIngredients.join(', ')}`)
            return
        }

        const productionRecord: ProductionRecord = {
            id: Date.now().toString(),
            recipeId,
            recipeName: recipe.name,
            batchCount: validBatchCount,
            date: date.toISOString(),
            totalProduced: validBatchCount * recipe.batchSize
        }

        // Update production history
        setProductionHistory(prev => [productionRecord, ...prev])

        // Update inventory (deduct ingredients used)
        const updatedInventory = [...inventory]
        recipe.ingredients.forEach(recipeIngredient => {
            const inventoryItem = updatedInventory.find(item => item.ingredientId === recipeIngredient.ingredientId)
            if (inventoryItem) {
                const amountUsed = recipeIngredient.amount * validBatchCount
                inventoryItem.currentStock = Math.max(0, inventoryItem.currentStock - amountUsed)
            }
        })
        setInventory(updatedInventory)
    }

    // Function to update inventory manually
    const updateInventory = (ingredientId: string, newStock: number) => {
        const validStock = validateNumber(newStock.toString(), 0, 100000)
        setInventory(prev => prev.map(item =>
            item.ingredientId === ingredientId
                ? { ...item, currentStock: validStock }
                : item
        ))
    }

    // Function to add inventory item
    const addInventoryItem = (ingredientId: string, minimumStock: number = 0) => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId)
        if (!ingredient || inventory.find(item => item.ingredientId === ingredientId)) {
            setError('Ingredient already in inventory or not found')
            return
        }

        const validMinStock = validateNumber(minimumStock.toString(), 0, 10000)
        const newInventoryItem: InventoryItem = {
            ingredientId,
            currentStock: 0,
            unit: ingredient.unit,
            minimumStock: validMinStock,
            lastUpdated: new Date().toISOString()
        }
        setInventory(prev => [...prev, newInventoryItem])
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="font-cursive text-3xl md:text-4xl lg:text-5xl text-[#C48A6A] mb-3">
                    Calculadora de Costos
                </h1>
                <p className="text-base text-gray-600 max-w-2xl mx-auto px-4">
                    Calcula los costos de tus recetas y optimiza tus ganancias
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 lg:mx-0">
                    <div className="flex justify-between items-center">
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-700 hover:text-red-900 font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile View Switcher */}
            <MobileViewSwitcher
                mobileView={mobileView}
                setMobileView={setMobileView}
            />

            {/* Content */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
                {/* Ingredients Panel - Hidden on mobile unless selected */}
                <div className={`${mobileView === 'ingredients' ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                    <IngredientsPanel
                        ingredients={ingredients}
                        setIngredients={setIngredients}
                        inventory={inventory}
                        updateInventory={updateInventory}
                        addInventoryItem={addInventoryItem}
                    />
                </div>

                <div className={`${mobileView === 'calculator' ? 'block' : 'hidden'} lg:block lg:col-span-2`}>
                    <RecipeCalculatorPanel
                        selectedRecipe={selectedRecipe}
                        setSelectedRecipe={setSelectedRecipe}
                        recipes={recipes}
                        setRecipes={setRecipes}
                        ingredients={ingredients}
                        recordProduction={recordProduction}
                    />
                </div>

                {/* Production Tracker Panel - Hidden on mobile unless selected */}
                <div className={`${mobileView === 'production' ? 'block' : 'hidden'} lg:block lg:col-span-3`}>
                    <ProductionTrackerPanel
                        productionHistory={productionHistory}
                        inventory={inventory}
                        ingredients={ingredients}
                        recipes={recipes}
                        updateInventory={updateInventory}
                    />
                </div>
            </div>
        </div>
    )
}