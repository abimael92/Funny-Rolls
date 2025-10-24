"use client"

import { useState, useEffect } from "react"
import { products, defaultIngredients } from "@/lib/data"
import { Ingredient, Recipe } from '@/lib/types'
import { MobileViewSwitcher } from './MobileViewSwitcher'
import { IngredientsPanel } from './IngredientsPanel'
import { RecipeCalculatorPanel } from './RecipeCalculatorPanel'

export function RecipeCalculator() {
    // Ingredients management
    const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients)
    const [recipes, setRecipes] = useState<Recipe[]>(products.map(p => p.recipe))
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0])
    const [mobileView, setMobileView] = useState<'ingredients' | 'calculator'>('calculator')

    // Load data from localStorage on component mount
    useEffect(() => {
        const savedIngredients = localStorage.getItem('recipe-calculator-ingredients')
        const savedRecipes = localStorage.getItem('recipe-calculator-recipes')

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
    }, [])
    // Save to localStorage whenever data changes
    useEffect(() => {
        localStorage.setItem('recipe-calculator-ingredients', JSON.stringify(ingredients))
    }, [ingredients])

    useEffect(() => {
        localStorage.setItem('recipe-calculator-recipes', JSON.stringify(recipes))
    }, [recipes])

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
            <MobileViewSwitcher mobileView={mobileView} setMobileView={setMobileView} />

            {/* Content */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
                {/* Ingredients Panel - Hidden on mobile unless selected */}
                <div className={`${mobileView === 'ingredients' ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                    <IngredientsPanel
                        ingredients={ingredients}
                        setIngredients={setIngredients}
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
                    />
                </div>
            </div>
        </div>
    )
}