"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save, Download, Upload } from "lucide-react"
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
                <CardTitle className="text-lg">Calculadora de Receta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-cursive text-2xl text-amber-800">{selectedRecipe.name}</h2>
                        </div>

                        {/* Price Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-amber-200">
                                <span className="text-lg font-semibold text-amber-700">Lote (unidades)</span>
                                <input
                                    type="number"
                                    value={selectedRecipe.batchSize}
                                    onChange={(e) => updateRecipeBatchSize(Number(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 border-2 border-amber-300 rounded-lg text-lg font-bold text-center"
                                    min="1"
                                />
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-amber-200">
                                <span className="text-lg font-semibold text-amber-700">Precio de venta</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-green-600 text-lg">$</span>
                                    <input
                                        type="number"
                                        value={selectedRecipe.sellingPrice}
                                        onChange={(e) => updateRecipeSellingPrice(Number(e.target.value) || 0)}
                                        className="w-24 px-3 py-2 border-2 border-amber-300 rounded-lg text-lg font-bold text-center"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <span className="text-lg font-semibold text-amber-700">Costo por unidad</span>
                                <span className="text-xl font-bold text-amber-800">${costPerItem.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <span className="text-lg font-semibold text-amber-700">Ganancia</span>
                                <span className="text-xl font-bold text-green-600">${profit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Ingredients Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Ingredientes</h3>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedRecipe.ingredients.map((recipeIngredient) => {
                                const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
                                if (!ingredient) return null

                                const cost = getIngredientCostPerUnit(ingredient) * recipeIngredient.amount

                                return (
                                    <div key={recipeIngredient.ingredientId} className="bg-white border-2 border-blue-200 rounded-xl p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-lg font-semibold text-blue-800">{ingredient.name}</span>
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
                                                    className="w-20 px-2 py-1 border-2 border-blue-300 rounded-lg text-base font-semibold text-center"
                                                />
                                                <span className="text-base font-medium text-blue-700">{ingredient.unit}</span>
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

                    {/* Mobile Cost Summary */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-green-800 mb-4 text-center">Resumen</h3>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Costo Total</div>
                                <div className="text-lg font-bold text-green-700">${totalRecipeCost.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Costo/Unidad</div>
                                <div className="text-lg font-bold text-green-700">${costPerItem.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Ganancia</div>
                                <div className="text-lg font-bold text-green-600">${profit.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Margen %</div>
                                <div className="text-lg font-bold text-green-600">{profitPercentage.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DESKTOP CONTENT - Hidden on mobile */}
                <div className="hidden lg:block space-y-6">
                    {/* Recipe Selection and Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Seleccionar Receta</label>

                            {products.filter(p => p.available).length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded text-center">
                                    <p className="text-amber-700">No hay recetas disponibles</p>
                                </div>
                            ) : (
                                <select
                                    className="w-full px-3 py-2 border rounded text-sm"
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

                    {/* Available Ingredients to Add */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                                Agregar Ingredientes a la Receta
                            </h3>
                            <div className="text-xs  text-amber-700 bg-amber-100   px-2 py-1 rounded-full">
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
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/10 transition-all duration-300"></div>
                                    </button>
                                ))
                            }

                            {ingredients.filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id)).length === 0 && (
                                <div className="w-full text-center py-4">
                                    <div className="text-green-600 text-sm">Todos los ingredientes agregados</div>
                                    <div className="text-green-500 text-xs mt-1">No hay más ingredientes disponibles para agregar</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recipe Ingredients */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                                Ingredientes de la Receta
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
                                                    <div className="font-semibold text-gray-900 text-sm">{ingredient.name}</div>
                                                    <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                                        ${getIngredientCostPerUnit(ingredient).toFixed(2)}/{ingredient.unit}
                                                    </div>
                                                </div>

                                                {/* Amount Input */}
                                                <div className="flex justify-between items-center gap-2 w-full">
                                                    {/* Amount + Unit */}
                                                    <div className="flex items-center gap-2 bg-amber-100 rounded-lg px-3 py-2 min-w-[120px]">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={recipeIngredient.amount}
                                                            onChange={(e) => updateRecipeIngredient(recipeIngredient.ingredientId, Number(e.target.value) || 0)}
                                                            className="w-16 bg-transparent border-none text-sm font-medium text-amber-800 focus:outline-none focus:ring-0"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="text-xs text-amber-700 font-medium">{ingredient.unit}</span>
                                                    </div>

                                                    {/* Cost Display */}
                                                    <div className="text-sm font-bold text-amber-700 bg-white border border-amber-200 rounded-lg px-3 py-2 min-w-[60px] text-center">
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
                        <div className="mt-4 pt-4 border-t border-amber-600">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-600">Costo/Unidad</div>
                                    <div className="font-bold text-amber-700">${costPerItem.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600">Total Lote</div>
                                    <div className="font-bold text-amber-700">${totalRecipeCost.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600">Ingredientes</div>
                                    <div className="font-bold text-amber-700">{selectedRecipe.ingredients.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cost Summary */}
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-3 text-amber-800 text-sm">Resumen de Costos</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600 text-xs">Costo Total Lote</div>
                                    <div className="font-bold text-base">${totalRecipeCost.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-xs">Costo por Unidad</div>
                                    <div className="font-bold text-base">${costPerItem.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-xs">Ganancia/Unidad</div>
                                    <div className="font-bold text-base text-green-600">${profit.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-xs">Margen %</div>
                                    <div className="font-bold text-base text-green-600">{profitPercentage.toFixed(1)}%</div>
                                </div>
                            </div>

                            {/* Profitability Indicator */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Rentabilidad:</span>
                                    <span className={profitPercentage >= 50 ? 'text-green-600' : profitPercentage >= 30 ? 'text-yellow-600' : 'text-red-600'}>
                                        {profitPercentage >= 50 ? 'Excelente' : profitPercentage >= 30 ? 'Buena' : 'Baja'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${profitPercentage >= 50 ? 'bg-green-500' :
                                            profitPercentage >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${Math.min(profitPercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="bg-amber-600 hover:bg-amber-700 flex-1 text-sm py-2">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Receta
                        </Button>
                        <Button onClick={handleExportData} variant="outline" className="flex-1 text-sm py-2">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                        <Button variant="outline" className="flex-1 text-sm py-2" onClick={() => document.getElementById('import-file')?.click()}>
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
            </CardContent>
        </Card>
    )
}