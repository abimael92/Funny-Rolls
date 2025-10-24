"use client"

import { useState, } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
import { Calculator, Plus, Trash2, Save, Download } from "lucide-react"

export interface Ingredient {
    id: string
    name: string
    price: number
    unit: string
    amount: number
}

export interface Recipe {
    id: string
    name: string
    ingredients: RecipeIngredient[]
    batchSize: number
    sellingPrice: number
    profitMargin: number
}

export interface RecipeIngredient {
    ingredientId: string
    amount: number
}

export function RecipeCalculator() {
    // Ingredients management
    const [ingredients, setIngredients] = useState<Ingredient[]>([
        { id: '1', name: 'Harina', price: 25, unit: 'kg', amount: 1 },
        { id: '2', name: 'Azúcar', price: 18, unit: 'kg', amount: 1 },
        { id: '3', name: 'Mantequilla', price: 120, unit: 'kg', amount: 1 },
        { id: '4', name: 'Canela', price: 200, unit: 'kg', amount: 1 },
        { id: '5', name: 'Levadura', price: 45, unit: 'kg', amount: 1 },
        { id: '6', name: 'Huevos', price: 45, unit: 'docena', amount: 1 },
        { id: '7', name: 'Leche', price: 25, unit: 'litro', amount: 1 },
        { id: '8', name: 'Crema para glaseado', price: 85, unit: 'kg', amount: 1 },
    ])

    // Recipes management
    const [recipes, setRecipes] = useState<Recipe[]>([
        {
            id: '1',
            name: 'Roll Clásico Risueño',
            batchSize: 12,
            sellingPrice: 50,
            profitMargin: 60,
            ingredients: [
                { ingredientId: '1', amount: 1 },
                { ingredientId: '2', amount: 0.3 },
                { ingredientId: '3', amount: 0.25 },
                { ingredientId: '4', amount: 0.05 },
                { ingredientId: '5', amount: 0.05 },
                { ingredientId: '6', amount: 0.5 },
                { ingredientId: '7', amount: 0.5 },
                { ingredientId: '8', amount: 0.2 },
            ]
        }
    ])

    const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'id'>>({
        name: '', price: 0, unit: '', amount: 1
    })
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0])

    // Calculate ingredient cost per unit
    const getIngredientCostPerUnit = (ingredient: Ingredient) => {
        return ingredient.price / ingredient.amount
    }

    // Calculate recipe cost
    const calculateRecipeCost = (recipe: Recipe) => {
        let totalCost = 0

        recipe.ingredients.forEach(recipeIngredient => {
            const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
            if (ingredient) {
                const costPerUnit = getIngredientCostPerUnit(ingredient)
                totalCost += costPerUnit * recipeIngredient.amount
            }
        })

        return totalCost
    }

    // Calculate cost per item
    const calculateCostPerItem = (recipe: Recipe) => {
        const totalCost = calculateRecipeCost(recipe)
        return totalCost / recipe.batchSize
    }

    // Calculate profit
    const calculateProfit = (recipe: Recipe) => {
        const costPerItem = calculateCostPerItem(recipe)
        return recipe.sellingPrice - costPerItem
    }

    // Calculate profit percentage
    const calculateProfitPercentage = (recipe: Recipe) => {
        const costPerItem = calculateCostPerItem(recipe)
        return ((recipe.sellingPrice - costPerItem) / recipe.sellingPrice) * 100
    }

    // Add new ingredient
    const addIngredient = () => {
        if (newIngredient.name && newIngredient.unit && newIngredient.price > 0) {
            const ingredient: Ingredient = {
                ...newIngredient,
                id: Date.now().toString()
            }
            setIngredients([...ingredients, ingredient])
            setNewIngredient({ name: '', price: 0, unit: '', amount: 1 })
        }
    }

    // Remove ingredient
    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id))
    }

    // Update recipe ingredient amount
    const updateRecipeIngredient = (ingredientId: string, amount: number) => {
        const updatedRecipe = {
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients.map(ri =>
                ri.ingredientId === ingredientId ? { ...ri, amount } : ri
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
            profitMargin: calculateProfitPercentage({ ...selectedRecipe, sellingPrice: price })
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

    const costPerItem = calculateCostPerItem(selectedRecipe)
    const totalRecipeCost = calculateRecipeCost(selectedRecipe)
    const profit = calculateProfit(selectedRecipe)
    const profitPercentage = calculateProfitPercentage(selectedRecipe)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="font-cursive text-4xl md:text-5xl text-[#C48A6A] mb-4">
                    Calculadora de Costos
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Calcula los costos de tus recetas y optimiza tus ganancias
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ingredients Panel */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Ingredientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add New Ingredient */}
                        <div className="space-y-3 p-4 bg-amber-50 rounded-lg">
                            <h3 className="font-semibold text-sm text-amber-800">Agregar Ingrediente</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={newIngredient.name}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                    className="px-3 py-2 border rounded text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Unidad"
                                    value={newIngredient.unit}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                    className="px-3 py-2 border rounded text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Precio"
                                    value={newIngredient.price || ''}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, price: parseFloat(e.target.value) || 0 })}
                                    className="px-3 py-2 border rounded text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Cantidad"
                                    value={newIngredient.amount || ''}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, amount: parseFloat(e.target.value) || 0 })}
                                    className="px-3 py-2 border rounded text-sm"
                                />
                            </div>
                            <Button onClick={addIngredient} className="w-full bg-amber-600 hover:bg-amber-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar
                            </Button>
                        </div>

                        {/* Ingredients List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {ingredients.map((ingredient) => (
                                <div key={ingredient.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{ingredient.name}</div>
                                        <div className="text-xs text-gray-500">
                                            ${ingredient.price} / {ingredient.amount} {ingredient.unit}
                                        </div>
                                        <div className="text-xs text-amber-600">
                                            ${getIngredientCostPerUnit(ingredient).toFixed(2)} por {ingredient.unit}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeIngredient(ingredient.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recipe Calculator */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Calculadora de Receta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Recipe Selection and Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Receta</label>
                                <select
                                    className="w-full px-3 py-2 border rounded"
                                    value={selectedRecipe.id}
                                    onChange={(e) => setSelectedRecipe(recipes.find(r => r.id === e.target.value) || recipes[0])}
                                >
                                    {recipes.map(recipe => (
                                        <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Tamaño del Lote (unidades)</label>
                                <input
                                    type="number"
                                    value={selectedRecipe.batchSize}
                                    onChange={(e) => updateRecipeBatchSize(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Precio de Venta por Unidad</label>
                                <input
                                    type="number"
                                    value={selectedRecipe.sellingPrice}
                                    onChange={(e) => updateRecipeSellingPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                        </div>

                        {/* Recipe Ingredients */}
                        <div>
                            <h3 className="font-semibold mb-3">Ingredientes de la Receta</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {selectedRecipe.ingredients.map((recipeIngredient) => {
                                    const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
                                    if (!ingredient) return null

                                    const cost = getIngredientCostPerUnit(ingredient) * recipeIngredient.amount

                                    return (
                                        <div key={recipeIngredient.ingredientId} className="flex items-center gap-4 p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium">{ingredient.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    ${getIngredientCostPerUnit(ingredient).toFixed(2)} por {ingredient.unit}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={recipeIngredient.amount}
                                                    onChange={(e) => updateRecipeIngredient(recipeIngredient.ingredientId, parseFloat(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border rounded text-sm"
                                                />
                                                <span className="text-sm text-gray-500">{ingredient.unit}</span>
                                            </div>
                                            <div className="text-sm font-medium w-20 text-right">
                                                ${cost.toFixed(2)}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeIngredientFromRecipe(recipeIngredient.ingredientId)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Available Ingredients to Add */}
                        <div>
                            <h3 className="font-semibold mb-3">Agregar Ingredientes Disponibles</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {ingredients
                                    .filter(ing => !selectedRecipe.ingredients.find(ri => ri.ingredientId === ing.id))
                                    .map(ingredient => (
                                        <Button
                                            key={ingredient.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addIngredientToRecipe(ingredient.id)}
                                            className="justify-start"
                                        >
                                            <Plus className="h-3 w-3 mr-2" />
                                            {ingredient.name}
                                        </Button>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Cost Summary */}
                        <Card className="bg-amber-50 border-amber-200">
                            <CardContent className="p-4">
                                <h3 className="font-semibold mb-3 text-amber-800">Resumen de Costos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-600">Costo Total del Lote</div>
                                        <div className="font-bold text-lg">${totalRecipeCost.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Costo por Unidad</div>
                                        <div className="font-bold text-lg">${costPerItem.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Ganancia por Unidad</div>
                                        <div className="font-bold text-lg text-green-600">${profit.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Margen de Ganancia</div>
                                        <div className="font-bold text-lg text-green-600">{profitPercentage.toFixed(1)}%</div>
                                    </div>
                                </div>

                                {/* Profitability Indicator */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Rentabilidad:</span>
                                        <span>{profitPercentage >= 50 ? 'Excelente' : profitPercentage >= 30 ? 'Buena' : 'Baja'}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${profitPercentage >= 50 ? 'bg-green-500' :
                                                profitPercentage >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(profitPercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button className="bg-amber-600 hover:bg-amber-700">
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Receta
                            </Button>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar Reporte
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}