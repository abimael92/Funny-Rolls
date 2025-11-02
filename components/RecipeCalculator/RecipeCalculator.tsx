"use client"

import { useState, useEffect } from "react"
import { products, defaultIngredients } from "@/lib/data"
import { Ingredient, Recipe } from '@/lib/types'
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

    // Load data from localStorage on component mount
    useEffect(() => {
        const savedIngredients = localStorage.getItem('recipe-calculator-ingredients')
        const savedRecipes = localStorage.getItem('recipe-calculator-recipes')
        const savedProductionHistory = localStorage.getItem('recipe-calculator-production-history')
        const savedInventory = localStorage.getItem('recipe-calculator-inventory')

        if (savedIngredients) {
            setIngredients(JSON.parse(savedIngredients))
        } else {
            localStorage.setItem('recipe-calculator-ingredients', JSON.stringify(defaultIngredients))
        }

        if (savedRecipes) {
            const parsedRecipes = JSON.parse(savedRecipes)
            // Ensure all recipes have steps array
            const recipesWithSteps = parsedRecipes.map((recipe: Recipe) => ({
                ...recipe,
                steps: recipe.steps || []
            }))
            setRecipes(recipesWithSteps)
            setSelectedRecipe(recipesWithSteps[0])
        } else {
            const initialRecipes = products.map(p => p.recipe)
            setRecipes(initialRecipes)
            setSelectedRecipe(initialRecipes[0])
            localStorage.setItem('recipe-calculator-recipes', JSON.stringify(initialRecipes))
        }

        if (savedProductionHistory) {
            setProductionHistory(JSON.parse(savedProductionHistory))
        }

        if (savedInventory) {
            setInventory(JSON.parse(savedInventory))
        } else {
            // Initialize inventory from ingredients
            const initialInventory = defaultIngredients.map(ingredient => ({
                ingredientId: ingredient.id,
                currentStock: 0,
                unit: ingredient.unit,
                minimumStock: 0
            }))
            setInventory(initialInventory)
            localStorage.setItem('recipe-calculator-inventory', JSON.stringify(initialInventory))
        }
    }, [])

    // Save to localStorage whenever data changes
    useEffect(() => {
        localStorage.setItem('recipe-calculator-ingredients', JSON.stringify(ingredients))
    }, [ingredients])

    useEffect(() => {
        localStorage.setItem('recipe-calculator-recipes', JSON.stringify(recipes))
    }, [recipes])

    useEffect(() => {
        localStorage.setItem('recipe-calculator-production-history', JSON.stringify(productionHistory))
    }, [productionHistory])

    useEffect(() => {
        localStorage.setItem('recipe-calculator-inventory', JSON.stringify(inventory))
    }, [inventory])

    // Function to record production
    const recordProduction = (recipeId: string, batchCount: number, date: Date = new Date()) => {
        const recipe = recipes.find(r => r.id === recipeId)
        if (!recipe) return

        const productionRecord: ProductionRecord = {
            id: Date.now().toString(),
            recipeId,
            recipeName: recipe.name,
            batchCount,
            date: date.toISOString(),
            totalProduced: batchCount * recipe.batchSize
        }

        // Update production history
        setProductionHistory(prev => [productionRecord, ...prev])

        // Update inventory (deduct ingredients used)
        const updatedInventory = [...inventory]
        recipe.ingredients.forEach(recipeIngredient => {
            const inventoryItem = updatedInventory.find(item => item.ingredientId === recipeIngredient.ingredientId)
            if (inventoryItem) {
                const amountUsed = recipeIngredient.amount * batchCount
                inventoryItem.currentStock = Math.max(0, inventoryItem.currentStock - amountUsed)
            }
        })
        setInventory(updatedInventory)
    }

    // Function to update inventory manually
    const updateInventory = (ingredientId: string, newStock: number) => {
        setInventory(prev => prev.map(item =>
            item.ingredientId === ingredientId
                ? { ...item, currentStock: newStock }
                : item
        ))
    }

    // Function to add inventory item
    const addInventoryItem = (ingredientId: string, minimumStock: number = 0) => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId)
        if (!ingredient || inventory.find(item => item.ingredientId === ingredientId)) return

        const newInventoryItem: InventoryItem = {
            ingredientId,
            currentStock: 0,
            unit: ingredient.unit,
            minimumStock
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

                {/* Recipe Calculator Panel - Hidden on mobile unless selected */}
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

// Add these types to your types file (lib/types.ts)
export interface ProductionRecord {
    id: string
    recipeId: string
    recipeName: string
    batchCount: number
    date: string
    totalProduced: number
}

export interface InventoryItem {
    ingredientId: string
    currentStock: number
    unit: string
    minimumStock: number
}