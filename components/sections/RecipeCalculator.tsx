"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Plus, Trash2, Save, Download, Upload } from "lucide-react" // Added Upload

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
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'id'>>({
        name: '', price: 0, unit: '', amount: 1
    })
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [mobileView, setMobileView] = useState<'ingredients' | 'calculator'>('calculator')

    // Load data from localStorage on component mount
    useEffect(() => {
        const savedIngredients = localStorage.getItem('recipe-calculator-ingredients')
        const savedRecipes = localStorage.getItem('recipe-calculator-recipes')

        if (savedIngredients) {
            setIngredients(JSON.parse(savedIngredients))
        } else {
            // Default ingredients if nothing saved
            const defaultIngredients: Ingredient[] = [
                { id: '1', name: 'Harina', price: 25, unit: 'kg', amount: 1 },
                { id: '2', name: 'Azúcar', price: 18, unit: 'kg', amount: 1 },
                { id: '3', name: 'Mantequilla', price: 120, unit: 'kg', amount: 1 },
                { id: '4', name: 'Canela', price: 200, unit: 'kg', amount: 1 },
                { id: '5', name: 'Levadura', price: 45, unit: 'kg', amount: 1 },
                { id: '6', name: 'Huevos', price: 45, unit: 'docena', amount: 1 },
                { id: '7', name: 'Leche', price: 25, unit: 'litro', amount: 1 },
                { id: '8', name: 'Crema para glaseado', price: 85, unit: 'kg', amount: 1 },
            ]
            setIngredients(defaultIngredients)
            localStorage.setItem('recipe-calculator-ingredients', JSON.stringify(defaultIngredients))
        }

        if (savedRecipes) {
            const parsedRecipes = JSON.parse(savedRecipes)
            setRecipes(parsedRecipes)
            setSelectedRecipe(parsedRecipes[0])
        } else {
            // Default recipe if nothing saved
            const defaultRecipe: Recipe = {
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
            setRecipes([defaultRecipe])
            setSelectedRecipe(defaultRecipe)
            localStorage.setItem('recipe-calculator-recipes', JSON.stringify([defaultRecipe]))
        }
    }, [])

    // Save to localStorage whenever data changes
    useEffect(() => {
        if (ingredients.length > 0) {
            localStorage.setItem('recipe-calculator-ingredients', JSON.stringify(ingredients))
        }
    }, [ingredients])

    useEffect(() => {
        if (recipes.length > 0) {
            localStorage.setItem('recipe-calculator-recipes', JSON.stringify(recipes))
            if (!selectedRecipe && recipes.length > 0) {
                setSelectedRecipe(recipes[0])
            }
        }
    }, [recipes, selectedRecipe])

    // Update selectedRecipe when recipes change
    useEffect(() => {
        if (selectedRecipe && recipes.length > 0) {
            const updatedRecipe = recipes.find(r => r.id === selectedRecipe.id)
            if (updatedRecipe) {
                setSelectedRecipe(updatedRecipe)
            }
        }
    }, [recipes])

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
            const newIngredients = [...ingredients, ingredient]
            setIngredients(newIngredients)
            setNewIngredient({ name: '', price: 0, unit: '', amount: 1 })
        }
    }

    // Remove ingredient
    const removeIngredient = (id: string) => {
        const newIngredients = ingredients.filter(ing => ing.id !== id)
        setIngredients(newIngredients)
    }

    // Update recipe ingredient amount
    const updateRecipeIngredient = (ingredientId: string, amount: number) => {
        if (!selectedRecipe) return

        const updatedRecipe = {
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients.map(ri =>
                ri.ingredientId === ingredientId ? { ...ri, amount } : ri
            )
        }
        setSelectedRecipe(updatedRecipe)
        const newRecipes = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
        setRecipes(newRecipes)
    }

    // Add ingredient to recipe
    const addIngredientToRecipe = (ingredientId: string) => {
        if (!selectedRecipe) return

        if (!selectedRecipe.ingredients.find(ri => ri.ingredientId === ingredientId)) {
            const updatedRecipe = {
                ...selectedRecipe,
                ingredients: [...selectedRecipe.ingredients, { ingredientId, amount: 0.1 }]
            }
            setSelectedRecipe(updatedRecipe)
            const newRecipes = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
            setRecipes(newRecipes)
        }
    }

    // Remove ingredient from recipe
    const removeIngredientFromRecipe = (ingredientId: string) => {
        if (!selectedRecipe) return

        const updatedRecipe = {
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients.filter(ri => ri.ingredientId !== ingredientId)
        }
        setSelectedRecipe(updatedRecipe)
        const newRecipes = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
        setRecipes(newRecipes)
    }

    // Update recipe selling price
    const updateRecipeSellingPrice = (price: number) => {
        if (!selectedRecipe) return

        const updatedRecipe = {
            ...selectedRecipe,
            sellingPrice: price,
            profitMargin: calculateProfitPercentage({ ...selectedRecipe, sellingPrice: price })
        }
        setSelectedRecipe(updatedRecipe)
        const newRecipes = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
        setRecipes(newRecipes)
    }

    // Update recipe batch size
    const updateRecipeBatchSize = (size: number) => {
        if (!selectedRecipe) return

        const updatedRecipe = { ...selectedRecipe, batchSize: size }
        setSelectedRecipe(updatedRecipe)
        const newRecipes = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
        setRecipes(newRecipes)
    }

    // Backup/Restore functions
    const exportData = () => {
        const data = {
            ingredients,
            recipes,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `recipe-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string)
                if (data.ingredients && data.recipes) {
                    setIngredients(data.ingredients)
                    setRecipes(data.recipes)
                    if (data.recipes.length > 0) {
                        setSelectedRecipe(data.recipes[0])
                    }
                    alert('Datos importados correctamente!')
                } else {
                    alert('Archivo inválido: falta ingredients o recipes')
                }
            } catch (error) {
                alert(`Error al importar el archivo: ${error}`)
            }
        }
        reader.readAsText(file)
        // Reset input
        event.target.value = ''
    }

    // Add new recipe function
    const addNewRecipe = () => {
        const newRecipe: Recipe = {
            id: Date.now().toString(),
            name: 'Nueva Receta',
            batchSize: 1,
            sellingPrice: 0,
            profitMargin: 0,
            ingredients: []
        }
        const newRecipes = [...recipes, newRecipe]
        setRecipes(newRecipes)
        setSelectedRecipe(newRecipe)
    }

    // Update recipe name
    const updateRecipeName = (recipeId: string, name: string) => {
        const newRecipes = recipes.map(recipe =>
            recipe.id === recipeId ? { ...recipe, name } : recipe
        )
        setRecipes(newRecipes)
        if (selectedRecipe?.id === recipeId) {
            setSelectedRecipe({ ...selectedRecipe, name })
        }
    }

    if (!selectedRecipe) {
        return <div>Cargando...</div>
    }

    const costPerItem = calculateCostPerItem(selectedRecipe)
    const totalRecipeCost = calculateRecipeCost(selectedRecipe)
    const profit = calculateProfit(selectedRecipe)
    const profitPercentage = calculateProfitPercentage(selectedRecipe)

    // Mobile view switcher
    const MobileViewSwitcher = () => (
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

    // Ingredients Panel Component
    const IngredientsPanel = () => (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5" />
                    Ingredientes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add New Ingredient */}
                <div className="space-y-3 p-4 bg-amber-50 rounded-lg">
                    <h3 className="font-semibold text-sm text-amber-800">Agregar Ingrediente</h3>
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Nombre del ingrediente"
                            value={newIngredient.name}
                            onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
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
                    </div>
                    <Button onClick={addIngredient} className="w-full bg-amber-600 hover:bg-amber-700 text-sm py-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Ingrediente
                    </Button>
                </div>

                {/* Ingredients List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="font-medium text-sm text-gray-700">Lista de Ingredientes</h4>
                    {ingredients.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{ingredient.name}</div>
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
                                className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    // Recipe Calculator Component
    const RecipeCalculatorPanel = () => (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Calculadora de Receta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Recipe Selection and Basic Info */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-3 py-2 border rounded text-sm"
                            value={selectedRecipe.id}
                            onChange={(e) => setSelectedRecipe(recipes.find(r => r.id === e.target.value) || recipes[0])}
                        >
                            {recipes.map(recipe => (
                                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                            ))}
                        </select>
                        <Button onClick={addNewRecipe} className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Recipe name input */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Nombre de Receta</label>
                        <input
                            type="text"
                            value={selectedRecipe.name}
                            onChange={(e) => updateRecipeName(selectedRecipe.id, e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Lote (unidades)</label>
                            <input
                                type="number"
                                value={selectedRecipe.batchSize}
                                onChange={(e) => updateRecipeBatchSize(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border rounded text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Precio Venta</label>
                            <input
                                type="number"
                                value={selectedRecipe.sellingPrice}
                                onChange={(e) => updateRecipeSellingPrice(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border rounded text-sm"
                            />
                        </div>
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
                                                onChange={(e) => updateRecipeIngredient(recipeIngredient.ingredientId, parseFloat(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border rounded text-sm"
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
                    <Button onClick={exportData} variant="outline" className="flex-1 text-sm py-2">
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
                        onChange={importData}
                        className="hidden"
                    />
                </div>
            </CardContent>
        </Card>
    )

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
            <MobileViewSwitcher />

            {/* Content */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
                {/* Ingredients Panel - Hidden on mobile unless selected */}
                <div className={`${mobileView === 'ingredients' ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                    <IngredientsPanel />
                </div>

                {/* Recipe Calculator Panel - Hidden on mobile unless selected */}
                <div className={`${mobileView === 'calculator' ? 'block' : 'hidden'} lg:block lg:col-span-2`}>
                    <RecipeCalculatorPanel />
                </div>
            </div>
        </div>
    )
}