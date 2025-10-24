"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Plus, Trash2, Save, Download, Upload, ChefHat, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import { products, defaultIngredients } from "@/lib/data";
import { Ingredient, Recipe } from '@/lib/types';
import {
    calculateRecipeCost,
    calculateCostPerItem,
    calculateProfit,
    calculateProfitPercentage,
    getIngredientCostPerUnit,
    exportRecipeData,
    importRecipeData
} from '@/lib/utils';

export function RecipeCalculator() {
    // Ingredients management
    const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients)
    const [recipes, setRecipes] = useState<Recipe[]>(products.map(p => p.recipe))
    const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'id'>>({
        name: '', price: 0, unit: '', amount: 1
    })
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0])
    const [mobileView, setMobileView] = useState<'ingredients' | 'calculator'>('calculator')
    const [newStep, setNewStep] = useState('')

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
            setRecipes(parsedRecipes)
            setSelectedRecipe(parsedRecipes[0])
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

    // Toggle recipe availability
    const toggleRecipeAvailability = (recipeId: string) => {
        const updatedRecipes = recipes.map(recipe =>
            recipe.id === recipeId ? { ...recipe, available: !recipe.available } : recipe
        )
        setRecipes(updatedRecipes)
        if (selectedRecipe.id === recipeId) {
            setSelectedRecipe({ ...selectedRecipe, available: !selectedRecipe.available })
        }
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

    // Backup/Restore functions
    const handleExportData = () => {
        exportRecipeData(ingredients, recipes)
    }

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        importRecipeData(file)
            .then((data) => {
                setIngredients(data.ingredients)
                setRecipes(data.recipes)
                if (data.recipes.length > 0) {
                    setSelectedRecipe(data.recipes[0])
                }
                alert('Datos importados correctamente!')
            })
            .catch((error) => {
                alert(error.message)
            })

        event.target.value = ''
    }

    // Update recipe name
    // const updateRecipeName = (recipeId: string, name: string) => {
    //     const updatedRecipes = recipes.map(recipe =>
    //         recipe.id === recipeId ? { ...recipe, name } : recipe
    //     )
    //     setRecipes(updatedRecipes)
    //     if (selectedRecipe.id === recipeId) {
    //         setSelectedRecipe({ ...selectedRecipe, name })
    //     }
    // }

    // Calculate costs using utils functions
    const costPerItem = calculateCostPerItem(selectedRecipe, ingredients)
    const totalRecipeCost = calculateRecipeCost(selectedRecipe, ingredients)
    const profit = calculateProfit(selectedRecipe, ingredients)
    const profitPercentage = calculateProfitPercentage(selectedRecipe, ingredients)

    // Roll Image Display Component
    const RollDisplay = () => {
        const product = products.find(p => p.name === selectedRecipe.name)

        return (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <ChefHat className="h-6 w-6 text-amber-600" />
                            <h3 className="font-semibold text-amber-800">Vista del Rollo</h3>
                        </div>
                        <Button
                            onClick={() => toggleRecipeAvailability(selectedRecipe.id)}
                            variant={selectedRecipe.available ? "default" : "outline"}
                            className={selectedRecipe.available ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {selectedRecipe.available ? (
                                <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                            )}
                            {selectedRecipe.available ? 'Disponible' : 'No Disponible'}
                        </Button>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        {/* Roll Image */}
                        <div className="flex-1 flex justify-center">
                            <div className="relative">
                                {product?.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        width={160}
                                        height={160}
                                        className="rounded-full shadow-lg border-4 border-amber-300 object-cover w-40 h-40"
                                    />
                                ) : (
                                    <div className="w-40 h-40 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 border-4 border-amber-300">
                                        Sin imagen
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Roll Details */}
                        <div className="flex-1 text-center lg:text-left">
                            <h4 className="font-cursive text-xl text-amber-700 mb-2">{selectedRecipe.name}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Lote:</span>
                                    <span className="font-semibold">{selectedRecipe.batchSize} unidades</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Precio:</span>
                                    <span className="font-semibold text-green-600">${selectedRecipe.sellingPrice}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Costo:</span>
                                    <span className="font-semibold">${costPerItem.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ganancia:</span>
                                    <span className="font-semibold text-green-600">${profit.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

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
                {/* Roll Display */}
                <RollDisplay />

                {/* Recipe Selection and Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Seleccionar Receta</label>
                        <select
                            className="w-full px-3 py-2 border rounded text-sm"
                            value={selectedRecipe.available ? selectedRecipe.id : recipes.find(r => r.available)?.id || ''}
                            onChange={(e) => {
                                const recipe = recipes.find(r => r.id === e.target.value)
                                if (recipe && recipe.available) setSelectedRecipe(recipe)
                            }}
                        >
                            {[...recipes]
                                .sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0)) // available first
                                .map(recipe => (
                                    <option
                                        key={recipe.id}
                                        value={recipe.id}
                                        disabled={!recipe.available}
                                        className={!recipe.available ? 'text-gray-400 bg-gray-100' : ''}
                                    >
                                        {recipe.name} {!recipe.available && '(No disponible)'}
                                    </option>
                                ))}
                        </select>
                        {!selectedRecipe.available && (
                            <p className="text-sm text-amber-600 mt-2">
                                ⚠️ Esta receta no está disponible. Selecciona una receta disponible.
                            </p>
                        )}
                    </div>
                </div>

                {/* Recipe Steps */}
                <div>
                    <h3 className="font-semibold mb-3 text-sm">Pasos de Preparación</h3>
                    <div className="space-y-2">
                        {selectedRecipe.steps.map((step, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                <div className="flex-1">
                                    <span className="text-sm font-medium mr-2">{index + 1}.</span>
                                    <span className="text-sm">{step}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeStep(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Agregar nuevo paso..."
                                value={newStep}
                                onChange={(e) => setNewStep(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded text-sm"
                            />
                            <Button onClick={addStep} className="bg-amber-600 hover:bg-amber-700">
                                <Plus className="h-4 w-4" />
                            </Button>
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