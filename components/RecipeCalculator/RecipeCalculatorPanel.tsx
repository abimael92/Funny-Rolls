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
                alert('Datos importados correctamente!')
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
                {/* Flip Card */}
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

                {/* Recipe Ingredients */}
                <div>
                    <h3 className="font-semibold mb-3 text-sm">Ingredientes de la Receta</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedRecipe.ingredients.map((recipeIngredient) => {
                            const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
                            if (!ingredient) return null

                            const cost = getIngredientCostPerUnit(ingredient) * recipeIngredient.amount

                            return (
                                <div key={recipeIngredient.ingredientId} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{ingredient.name}</div>
                                        <div className="text-xs text-gray-500">
                                            ${getIngredientCostPerUnit(ingredient).toFixed(2)}/{ingredient.unit}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={recipeIngredient.amount}
                                                onChange={(e) => updateRecipeIngredient(recipeIngredient.ingredientId, Number(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            />
                                            <span className="text-xs text-gray-500">{ingredient.unit}</span>
                                        </div>
                                        <div className="text-sm font-medium w-14 text-right">
                                            ${cost.toFixed(2)}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeIngredientFromRecipe(recipeIngredient.ingredientId)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Available Ingredients to Add */}
                <div>
                    <h3 className="font-semibold mb-3 text-sm">Agregar Ingredientes</h3>
                    <div className="flex flex-wrap gap-2">
                        {ingredients
                            .filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id))
                            .map(ingredient => (
                                <Button
                                    key={ingredient.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addIngredientToRecipe(ingredient.id)}
                                    className="text-xs py-1 h-auto"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {ingredient.name}
                                </Button>
                            ))
                        }
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
            </CardContent>
        </Card>
    )
}