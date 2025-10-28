"use client"

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Download, Upload } from "lucide-react"
import { products } from "@/lib/data"
import { Ingredient, Recipe } from '@/lib/types'
import {
    calculateRecipeCost,
    calculateCostPerItem,
    calculateProfit,
    calculateProfitPercentage,
    getIngredientCostPerUnit,
    exportRecipeData,
    importRecipeData
} from '@/lib/utils'
import { FlipCard } from './FlipCard'

interface RecipeCalculatorPanelProps {
    selectedRecipe: Recipe
    setSelectedRecipe: (recipe: Recipe) => void
    recipes: Recipe[]
    setRecipes: (recipes: Recipe[]) => void
    ingredients: Ingredient[]
}

export function RecipeCalculatorPanel({
    selectedRecipe,
    setSelectedRecipe,
    recipes,
    setRecipes,
    ingredients
}: RecipeCalculatorPanelProps) {
    const [newStep, setNewStep] = useState('')
    const [isEditingSteps, setIsEditingSteps] = useState(false)
    const [isCardFlipped, setIsCardFlipped] = useState(false)
    const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

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

    // Update recipe selling price
    const updateRecipeSellingPrice = (price: number) => {
        const updatedRecipe = {
            ...selectedRecipe,
            sellingPrice: price,
            profitMargin: calculateProfitPercentage({ ...selectedRecipe, sellingPrice: price }, ingredients)
        }
        setSelectedRecipe(updatedRecipe)
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
    }

    // Update recipe batch size
    const updateRecipeBatchSize = (size: number) => {
        const updatedRecipe = { ...selectedRecipe, batchSize: size }
        setSelectedRecipe(updatedRecipe)
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
    }

    // Add step to recipe
    const addStep = () => {
        if (newStep.trim()) {
            const updatedRecipe = {
                ...selectedRecipe,
                steps: [...selectedRecipe.steps, newStep.trim()]
            }
            setSelectedRecipe(updatedRecipe)
            setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
            setNewStep('')
        }
    }

    // Remove step from recipe
    const removeStep = (index: number) => {
        const updatedRecipe = {
            ...selectedRecipe,
            steps: selectedRecipe.steps.filter((_, i) => i !== index)
        }
        setSelectedRecipe(updatedRecipe)
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
    }

    // Update step in recipe
    const updateStep = (index: number, newStepText: string) => {
        const updatedSteps = [...selectedRecipe.steps]
        updatedSteps[index] = newStepText
        const updatedRecipe = {
            ...selectedRecipe,
            steps: updatedSteps
        }
        setSelectedRecipe(updatedRecipe)
    }

    // Save steps and exit edit mode
    const saveSteps = () => {
        setRecipes(recipes.map(r => r.id === selectedRecipe.id ? selectedRecipe : r))
        setIsEditingSteps(false)
    }

    // Backup/Restore functions
    const handleExportData = () => {
        exportRecipeData(ingredients, recipes)
    }

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        importRecipeData(file)
            .then((data) => {
                // This would need to be handled in the parent component
                alert(`Datos importados correctamente! here is your ${data}`)
            })
            .catch((error) => {
                alert(error.message)
            })

        event.target.value = ''
    }

    // Calculate costs using utils functions
    const costPerItem = calculateCostPerItem(selectedRecipe, ingredients)
    const totalRecipeCost = calculateRecipeCost(selectedRecipe, ingredients)
    const profit = calculateProfit(selectedRecipe, ingredients)
    const profitPercentage = calculateProfitPercentage(selectedRecipe, ingredients)

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

                                {/* Dropdown menu */}
                                {isMobileDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-amber-500 rounded-xl mt-2 max-h-80 overflow-y-auto z-50 shadow-xl custom-dropdown">
                                        {products
                                            .filter(product => product.available)
                                            .map(product => (
                                                <button
                                                    key={product.recipe.id}
                                                    onClick={() => {
                                                        setSelectedRecipe(product.recipe)
                                                        setIsMobileDropdownOpen(false)
                                                        setIsCardFlipped(false)
                                                        setIsEditingSteps(false)
                                                    }}
                                                    className={`w-full px-4 py-4 text-left text-lg border-b border-amber-100 last:border-b-0 hover:bg-amber-50 active:bg-amber-100 transition-colors ${selectedRecipe.id === product.recipe.id
                                                        ? 'bg-amber-100 text-amber-800 font-semibold'
                                                        : 'text-gray-800'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{product.recipe.name}</span>
                                                        {selectedRecipe.id === product.recipe.id && (
                                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Close dropdown when clicking outside (backdrop) */}
                    {isMobileDropdownOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-10 z-40 lg:hidden"
                            onClick={() => setIsMobileDropdownOpen(false)}
                        />
                    )}
                </div>

                {/* Flip Card - Desktop Only */}
                <div className="hidden lg:block">
                    <FlipCard
                        selectedRecipe={selectedRecipe}
                        costPerItem={costPerItem}
                        profit={profit}
                        updateRecipeBatchSize={updateRecipeBatchSize}
                        updateRecipeSellingPrice={updateRecipeSellingPrice}
                        isCardFlipped={isCardFlipped}
                        setIsCardFlipped={setIsCardFlipped}
                        isEditingSteps={isEditingSteps}
                        setIsEditingSteps={setIsEditingSteps}
                        newStep={newStep}
                        setNewStep={setNewStep}
                        updateStep={updateStep}
                        removeStep={removeStep}
                        addStep={addStep}
                        saveSteps={saveSteps}
                    />
                </div>

                {/* Mobile Price and Ingredients Section */}
                <div className="lg:hidden space-y-4">
                    {/* Mobile Recipe Header */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-cursive text-2xl text-blue-800">{selectedRecipe.name}</h2>
                        </div>

                        {/* Price Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                <span className="text-lg font-semibold text-blue-700">Lote (unidades)</span>
                                <input
                                    type="number"
                                    value={selectedRecipe.batchSize}
                                    onChange={(e) => updateRecipeBatchSize(Number(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 border-2 border-blue-300 rounded-lg text-lg font-bold text-center"
                                    min="1"
                                />
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                <span className="text-lg font-semibold text-blue-700">Precio de venta</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-green-600 text-lg">$</span>
                                    <input
                                        type="number"
                                        value={selectedRecipe.sellingPrice}
                                        onChange={(e) => updateRecipeSellingPrice(Number(e.target.value) || 0)}
                                        className="w-24 px-3 py-2 border-2 border-blue-300 rounded-lg text-lg font-bold text-center"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <span className="text-lg font-semibold text-blue-700">Costo por unidad</span>
                                <span className="text-xl font-bold text-red-800">${costPerItem.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <span className="text-lg font-semibold text-blue-700">Ganancia</span>
                                <span className="text-xl font-bold text-green-600">${profit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Ingredients Section */}
                    <div className="bg-gradient-to-br from-amber-50 to-cyan-50 border-2 border-amber-300 rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-amber-800 mb-4 text-center">Ingredientes</h3>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedRecipe.ingredients.map((recipeIngredient) => {
                                const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
                                if (!ingredient) return null

                                const cost = getIngredientCostPerUnit(ingredient) * recipeIngredient.amount

                                return (
                                    <div key={recipeIngredient.ingredientId} className="bg-white border-2 border-amber-200 rounded-xl p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-lg font-semibold text-amber-800">{ingredient.name}</span>
                                            <span className="text-sm font-bold text-green-600">${cost.toFixed(2)}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={recipeIngredient.amount}
                                                    onChange={(e) => updateRecipeIngredient(recipeIngredient.ingredientId, Number(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border-2 border-amber-300 rounded-lg text-base font-semibold text-center"
                                                />
                                                <span className="text-base font-medium text-amber-700">{ingredient.unit}</span>
                                            </div>

                                            <button
                                                onClick={() => removeIngredientFromRecipe(recipeIngredient.ingredientId)}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-amber-800 text-lg flex items-center gap-2">
                                Agregar Ingredientes
                            </h3>
                            <div className="text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                                {ingredients.filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id)).length} disponibles
                            </div>
                        </div>

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

                    {/* Mobile Cost Summary */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-green-800 mb-4 text-center">Resumen de Costos</h3>

                        <div className="grid grid-cols-2 gap-4 text-center max-h-55 overflow-y-auto pr-2">

                            <div className="bg-white border-2 border-red-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Costo/Unidad</div>
                                <div className="text-lg font-bold text-red-700">${costPerItem.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Precio de Venta</div>
                                <div className="text-lg font-bold text-green-700">${(selectedRecipe.sellingPrice)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Ganancia por Unidad</div>
                                <div className="text-lg font-bold text-green-600">${profit.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Margen %</div>
                                <div className="text-lg font-bold text-green-600">{profitPercentage.toFixed(1)}%</div>
                            </div>

                            <div className="bg-white border-2 border-red-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Costo Total/Lote</div>
                                <div className="text-lg font-bold text-red-700">${totalRecipeCost.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Venta de Lote</div>
                                <div className="text-lg font-bold text-green-700">${(selectedRecipe.sellingPrice * selectedRecipe.batchSize).toFixed(2)}</div>
                            </div>

                            <div className="flex flex-col gap-4 p-3 col-span-2">

                                <div className="bg-white border-2 border-red-200 rounded-xl p-3">
                                    <div className="text-sm text-gray-600">Costo total de Ingredientes</div>
                                    <div className="text-lg font-bold text-red-700">
                                        $
                                        {ingredients
                                            .reduce((total, ing) => total + ing.price, 0)
                                            .toFixed(2)
                                            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-vlue-400 rounded-xl p-3">
                                    <div className="text-sm text-gray-600">Meta de Lotes</div>
                                    <div className="text-lg font-bold text-blue-700">
                                        {Math.ceil(
                                            ingredients.reduce((total, ing) => total + ing.price, 0) /
                                            selectedRecipe.sellingPrice
                                        )}{' '}
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                    className="w-full px-4 py-4 border-2 border-amber-500 rounded-xl text-lg font-medium text-amber-700 bg-white flex justify-between items-center shadow-sm hover:shadow-md transition-shadow"
                                    value={selectedRecipe.id}
                                    onChange={(e) => {
                                        const recipe = recipes.find(r => r.id === e.target.value)
                                        if (recipe) {
                                            setSelectedRecipe(recipe)
                                            setIsCardFlipped(false)
                                            setIsEditingSteps(false)
                                        }
                                    }}
                                >
                                    {products
                                        .filter(product => product.available)
                                        .map(product => (
                                            <option key={product.recipe.id} value={product.recipe.id}>
                                                {product.recipe.name}
                                            </option>
                                        ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Mobile Add Ingredients Section */}
                    <div className="lg:hidden bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                                Agregar Ingredientes
                            </h3>
                            <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                {ingredients.filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id)).length} disponibles
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {ingredients
                                .filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id))
                                .map(ingredient => (
                                    <button
                                        key={ingredient.id}
                                        onClick={() => addIngredientToRecipe(ingredient.id)}
                                        className="group relative overflow-hidden bg-white hover:bg-green-50 border border-amber-300 hover:border-amber-400 rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4 text-amber-600 group-hover:text-amber-700 transition-colors" />
                                            <span className="text-sm font-medium text-amber-800 group-hover:text-amber-900">
                                                {ingredient.name}
                                            </span>
                                        </div>
                                    </button>
                                ))}

                            {ingredients.filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id)).length === 0 && (
                                <div className="w-full text-center py-2">
                                    <div className="text-green-600 text-sm">Todos los ingredientes agregados</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add Ingredients Section - Desktop */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-amber-800 text-lg flex items-center gap-2">
                                Agregar Ingredientes
                            </h3>
                            <div className="text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                                {ingredients.filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id)).length} disponibles
                            </div>
                        </div>

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

                        <div className="flex items-center mb-4">
                            <h3 className="w-full font-semibold text-amber-800 text-xl flex items-center justify-between">
                                <span>Ingredientes de la Receta</span>
                                <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded-full text-xs font-normal">
                                    {selectedRecipe.ingredients.length} ingredientes
                                </span>
                            </h3>
                        </div>




                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {selectedRecipe.ingredients.map((recipeIngredient) => {
                                const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
                                if (!ingredient) return null

                                const cost = getIngredientCostPerUnit(ingredient) * recipeIngredient.amount
                                const costPercentage = (cost / totalRecipeCost) * 100

                                return (
                                    <div
                                        key={recipeIngredient.ingredientId}
                                        className="group relative bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                                    >
                                        {/* Cost percentage bar */}
                                        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-xl"
                                            style={{ width: `${Math.min(costPercentage, 100)}%` }}></div>

                                        <div className="flex items-center justify-between">
                                            {/* Ingredient Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="font-semibold text-gray-900 text-lg">{ingredient.name}</div>
                                                    <div className="text-md text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                                        ${getIngredientCostPerUnit(ingredient).toFixed(2)}/{ingredient.unit}
                                                    </div>
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

                                                    {/* Cost Display */}
                                                    <div className="text-lg font-bold text-amber-700 bg-amber-50 border-2 border-amber-200 rounded-lg px-4 py-2 min-w-[80px] text-center shadow-sm">
                                                        ${cost.toFixed(2)}
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

                                        {/* Cost percentage indicator */}
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Porcentaje del costo total:</span>
                                            <span className="font-medium text-amber-700">{costPercentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                )
                            })}

                            {selectedRecipe.ingredients.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="text-amber-500 text-sm mb-2">No hay ingredientes en esta receta</div>
                                    <div className="text-amber-400 text-xs">Agrega ingredientes usando la sección de arriba</div>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-10 lg:grid-cols-4">
                            <div className="bg-white border-2 border-red-200 rounded-xl p-3 text-center">
                                <div className="text-sm text-gray-600">Costo/Unidad</div>
                                <div className="text-lg font-bold text-red-700">${costPerItem.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3 text-center">
                                <div className="text-sm text-gray-600">Ganancia/Unidad</div>
                                <div className="text-lg font-bold text-green-600">${profit.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-blue-200 rounded-xl p-3 text-center">
                                <div className="text-sm text-gray-600">Margen %</div>
                                <div className="text-lg font-bold text-blue-600">{profitPercentage.toFixed(1)}%</div>
                            </div>

                            <div className="bg-white border-2 border-purple-200 rounded-xl p-3 text-center">
                                <div className="text-sm text-gray-600">Costo Total</div>
                                <div className="text-lg font-bold text-purple-700">${totalRecipeCost.toFixed(2)}</div>
                            </div>

                        </div>
                    </div>

                    {/* Cost Summary */}
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-3 text-amber-800 text-xl">Resumen de Costos</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600 text-md">Costo Total Lote</div>
                                    <div className="font-bold text-lg">${totalRecipeCost.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-md">Costo por Unidad</div>
                                    <div className="font-bold text-lg">${costPerItem.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-md">Ganancia/Unidad</div>
                                    <div className="font-bold text-lg text-green-600">${profit.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-md">Margen %</div>
                                    <div className="font-bold text-lg text-green-600">{profitPercentage.toFixed(1)}%</div>
                                </div>
                            </div>

                            {/* Profitability Indicator */}
                            <div className="mt-4">
                                <div className="flex justify-between text-lg mb-1">
                                    <span>Rentabilidad:</span>
                                    <span className={profitPercentage >= 50 ? 'text-green-600' : profitPercentage >= 30 ? 'text-yellow-600' : 'text-red-600'}>
                                        {profitPercentage >= 50 ? 'Excelente' : profitPercentage >= 30 ? 'Buena' : 'Baja'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-6">
                                    <div
                                        className={`h-6 rounded-full transition-all duration-300 ${profitPercentage >= 50 ? 'bg-green-500' :
                                            profitPercentage >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${Math.min(profitPercentage, 100)}%` }}
                                    ></div>
                                </div>

                                {/* Centered Total Ingredients and Meta */}
                                <div className="grid grid-cols-2 gap-4 mt-16 text-center">
                                    <div className="bg-white border-2 border-red-200 rounded-xl p-4">
                                        <div className="text-sm text-gray-600 mb-2">Costo Total Ingredientes</div>
                                        <div className="text-xl font-bold text-red-700">
                                            ${ingredients
                                                .reduce((total, ing) => total + ing.price, 0)
                                                .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                            }
                                        </div>
                                    </div>

                                    <div className="bg-white border-2 border-blue-400 rounded-xl p-4">
                                        <div className="text-sm text-gray-600 mb-2">Meta de Lotes</div>
                                        <div className="text-xl font-bold text-blue-700">
                                            {Math.ceil(
                                                ingredients.reduce((total, ing) => total + ing.price, 0) /
                                                selectedRecipe.sellingPrice
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Profit Goal Input */}
                                <div className="mt-4 bg-white border-2 border-green-200 rounded-xl p-4 text-center">
                                    <div className="text-sm text-gray-600 mb-2">Ganancia Aproximada</div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-600 text-2xl  font-bold">$</span>
                                        <span className=" text-2xl font-bold text-center font-bold text-green-600">
                                            {(
                                                Math.ceil(
                                                    ingredients.reduce((total, ing) => total + ing.price, 0) /
                                                    selectedRecipe.sellingPrice
                                                ) *
                                                (selectedRecipe.sellingPrice * selectedRecipe.batchSize)
                                            ).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        </span>
                                    </div>

                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* <Button className="bg-amber-600 hover:bg-amber-700 flex-1 text-sm py-2">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Receta
                        </Button> */}
                        <Button onClick={handleExportData} variant="outline" className="bg-amber-500 hover:bg-amber-600 text-white flex-1 text-lg py-2 shadow-sm  transition-colors">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                        <Button variant="outline" className="bg-gray-300 hover:bg-gray-200 text-gray-80 flex-1 text-lg py-2 shadow-sm transition-colors" onClick={() => document.getElementById('import-file-mobile')?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                        </Button>
                        <input
                            id="import-file"
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* MOBILE ACTION BUTTONS - Add this section for mobile */}
                <div className="lg:hidden flex flex-col gap-3 pt-4">
                    {/* <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-700 flex-1 text-lg py-2">
                        <Save className="h-[1.2em] w-[1.2em] mr-2" />
                        Guardar Receta
                    </Button> */}
                    <div className="flex gap-3">
                        <Button onClick={handleExportData} variant="outline" className="bg-amber-500 hover:bg-amber-600 text-white flex-1 text-lg py-2 shadow-sm  transition-colors">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                        <Button variant="outline" className="bg-gray-300 hover:bg-gray-200 text-gray-80 flex-1 text-lg py-2 shadow-sm transition-colors" onClick={() => document.getElementById('import-file-mobile')?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                        </Button>
                    </div>
                    <input
                        id="import-file-mobile"
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                    />
                </div>
            </CardContent>
        </Card >
    )
}