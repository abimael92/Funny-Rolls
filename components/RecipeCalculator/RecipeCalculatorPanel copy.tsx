"use client"

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, } from "lucide-react"
import { products } from "@/lib/data"
import { Ingredient, Recipe } from '@/lib/types'

interface RecipeCalculatorPanelProps {
    selectedRecipe: Recipe
    setSelectedRecipe: (recipe: Recipe) => void
    recipes: Recipe[]
    setRecipes: (recipes: Recipe[]) => void
    ingredients: Ingredient[]
    recordProduction: (recipeId: string, batchCount: number) => void // ✅ ADDED THIS PROP
}

export function RecipeCalculatorPanel({
    selectedRecipe,
    setSelectedRecipe,
    recipes,
    setRecipes,
    ingredients,
}: RecipeCalculatorPanelProps) {

    const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [productionBatchCount, setProductionBatchCount] = useState(1)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMobileDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Update recipe ingredient amount
    const updateRecipeIngredient = (ingredientId: string, amount: number) => {
        const updatedRecipe = {
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients.map(ri =>
                ri.ingredientId === ingredientId ? { ...ri, amount: amount || 0 } : ri
            )
        }
        setSelectedRecipe(updatedRecipe)
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
    }

    // Add ingredient to recipe
    const addIngredientToRecipe = (ingredientId: string) => {
        if (!selectedRecipe.ingredients.find(ri => ri.ingredientId === ingredientId)) {
            const updatedRecipe = {
                ...selectedRecipe,
                ingredients: [...selectedRecipe.ingredients, { ingredientId, amount: 0.1 }]
            }
            setSelectedRecipe(updatedRecipe)
            setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
        }
    }

    // Remove ingredient from recipe
    const removeIngredientFromRecipe = (ingredientId: string) => {
        const updatedRecipe = {
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients.filter(ri => ri.ingredientId !== ingredientId)
        }
        setSelectedRecipe(updatedRecipe)
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
    }




    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">Calculadora de Receta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Custom Mobile Recipe Dropdown */}
                <div className="space-y-4 lg:hidden">
                    <div>
                        <label className="block text-lg font-medium mb-2">Seleccionar Receta</label>
                        {products.filter(p => p.available).length === 0 ? (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded text-center">
                                <p className="text-amber-700">No hay recetas disponibles</p>
                            </div>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                {/* Custom dropdown trigger */}
                                <button
                                    onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                                    className="w-full px-4 py-4 border-2 border-amber-500 rounded-xl text-lg font-medium text-amber-700 bg-white flex justify-between items-center shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <span className="truncate">{selectedRecipe.name}</span>
                                    <svg
                                        className={`w-6 h-6 text-amber-600 transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>


                            </div>
                        )}
                    </div>


                </div>



            </CardContent>
        </Card >
    )
}