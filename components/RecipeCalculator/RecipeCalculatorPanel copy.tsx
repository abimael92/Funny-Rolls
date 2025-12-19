"use client"

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
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
    recordProduction // ✅ ADDED THIS PROP
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








    const handleRecordProduction = () => {
        if (productionBatchCount > 0) {
            recordProduction(selectedRecipe.id, productionBatchCount) // ✅ NOW THIS WILL WORK
            setProductionBatchCount(1)
            // Show success message or notification
            alert(`Producción registrada: ${productionBatchCount} lote(s) de ${selectedRecipe.name}`)
        }
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




                <div className="hidden lg:block space-y-6">
                    {/* Recipe Selection and Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-2xl font-medium text-amber-700 mb-2">Seleccionar Receta</label>

                            {products.filter(p => p.available).length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded text-center">
                                    <p className="text-amber-700">No hay recetas disponibles</p>
                                </div>
                            ) : (
                                <select
                                    className="w-full px-4 py-4 border-2 border-amber-500 rounded-xl text-lg font-medium text-amber-700 bg-white flex justify-between items-center shadow-sm hover:bg-amber-200 hover:shadow-md transition-all"
                                    value={selectedRecipe.id}

                                >

                                </select>
                            )}
                        </div>
                    </div>

                    {/* Desktop Production Registration */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">Registrar Producción</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="text-lg font-semibold text-purple-700">Lotes producidos hoy</div>
                                <div className="text-sm text-purple-600">
                                    Total: {productionBatchCount * selectedRecipe.batchSize} unidades
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={productionBatchCount}
                                    onChange={(e) => setProductionBatchCount(Number(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 border-2 border-purple-300 rounded-lg text-lg font-bold text-center"
                                    min="1"
                                />
                                <Button
                                    onClick={handleRecordProduction}
                                    className="bg-purple-600 hover:bg-purple-700 text-lg py-2"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Registrar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Add Ingredients Section - Desktop */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
           

                        <div className="flex flex-wrap gap-2">
                            {ingredients
                                .filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id))
                                .map(ingredient => (
                                    <button
                                        key={ingredient.id}
                                        onClick={() => addIngredientToRecipe(ingredient.id)}
                                        className="group relative overflow-hidden bg-white hover:bg-green-50 border border-amber-300 hover:border-amber-400 rounded-lg px-4 py-3 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-5 w-5 text-amber-600 group-hover:text-amber-700 transition-colors" />
                                            <span className="text-base font-medium text-amber-800 group-hover:text-amber-900">
                                                {ingredient.name}
                                            </span>
                                        </div>
                                    </button>
                                ))}

                            {ingredients.filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id)).length === 0 && (
                                <div className="w-full text-center py-2">
                                    <div className="text-green-600 text-base">Todos los ingredientes agregados</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recipe Ingredients */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">



                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {selectedRecipe.ingredients.map((recipeIngredient) => {
                                const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
                                if (!ingredient) return null


                                return (
                                    <div
                                        key={recipeIngredient.ingredientId}
                                        className="group relative bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                                    >

                                        <div className="flex items-center justify-between">
                                            {/* Ingredient Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="font-semibold text-gray-900 text-lg">{ingredient.name}</div>
                                              
                                                </div>

                                                {/* Amount Input */}
                                                <div className="flex justify-between items-center gap-2 w-full">
                                                    {/* Amount + Unit */}
                                                    <div className="flex items-center gap-2 bg-white border-2 border-amber-300 rounded-lg px-3 py-2 min-w-[140px] hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={recipeIngredient.amount}
                                                            onChange={(e) => updateRecipeIngredient(recipeIngredient.ingredientId, Number(e.target.value) || 0)}
                                                            className="w-20 bg-transparent border-none text-md font-bold text-amber-900 focus:outline-none focus:ring-0"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="text-md text-amber-700 font-semibold">{ingredient.unit}</span>
                                                    </div>

                                        
                                                </div>

                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeIngredientFromRecipe(recipeIngredient.ingredientId)}
                                                className="opacity-0 group-hover:opacity-100 ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                title="Eliminar ingrediente"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

               
                                    </div>
                                )
                            })}
                            
                            

                        </div>


                    </div>

               
                </div>

            </CardContent>
        </Card >
    )
}