"use client"

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Download, Upload, Wrench } from "lucide-react"
import { products, toolCategories } from '@/lib/data'
import { Ingredient, Recipe, Tool } from '@/lib/types'
import {
    calculateRecipeCost,
    calculateCostPerItem,
    calculateProfit,
    calculateProfitPercentage,
    getIngredientCostPerUnit,
    exportRecipeData,
    importRecipeData,
} from '@/lib/utils'
import { FlipCard } from './FlipCard';
import { CloseButton, ActionButton } from './ModalHelpers';

interface RecipeCalculatorPanelProps {
    selectedRecipe: Recipe
    setSelectedRecipe: (recipe: Recipe) => void
    recipes: Recipe[]
    setRecipes: (recipes: Recipe[]) => void
    ingredients: Ingredient[];
    tools: Tool[];
    recordProduction: (recipeId: string, batchCount: number) => void
}

export function RecipeCalculatorPanel({
    selectedRecipe,
    setSelectedRecipe,
    recipes,
    setRecipes,
    ingredients,
    tools,
    recordProduction
}: RecipeCalculatorPanelProps) {
    const [newStep, setNewStep] = useState('')
    const [isEditingSteps, setIsEditingSteps] = useState(false)
    const [isCardFlipped, setIsCardFlipped] = useState(false)
    const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [productionBatchCount, setProductionBatchCount] = useState(1)
    const [showCostModal, setShowCostModal] = useState(false);
    const [showUnitCostModal, setShowUnitCostModal] = useState(false);
    const [showProfitModal, setShowProfitModal] = useState(false);
    const [showMarginModal, setShowMarginModal] = useState(false);
    const [showTotalIngredientsModal, setShowTotalIngredientsModal] = useState(false);
    const [showLotesModal, setShowLotesModal] = useState(false);
    const [showProfitGoalModal, setShowProfitGoalModal] = useState(false);
    const [showAddTools, setShowAddTools] = useState(false);
    const [showRecipeTools, setShowRecipeTools] = useState(false);


    console.log('selecter recipe: ', selectedRecipe);



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

    // Add tool to recipe
    const addToolToRecipe = (toolId: string) => {
        if (!selectedRecipe.tools?.find(rt => rt.toolId === toolId)) {
            const updatedRecipe = {
                ...selectedRecipe,
                tools: [...(selectedRecipe.tools || []), { toolId, usage: 'full' as const }]
            }
            setSelectedRecipe(updatedRecipe)
            setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
        }
    }

    // Remove tool from recipe
    const removeToolFromRecipe = (toolId: string) => {
        const updatedRecipe = {
            ...selectedRecipe,
            tools: selectedRecipe.tools?.filter(rt => rt.toolId !== toolId) || []
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

    const handleRecordProduction = () => {
        if (productionBatchCount > 0) {
            recordProduction(selectedRecipe.id, productionBatchCount) // ✅ NOW THIS WILL WORK
            setProductionBatchCount(1)
            // Show success message or notification
            alert(`Producción registrada: ${productionBatchCount} lote(s) de ${selectedRecipe.name}`)
        }
    }

    // Calculate costs using utils functions
    const costPerItem = calculateCostPerItem(selectedRecipe, ingredients)
    const totalRecipeCost = calculateRecipeCost(selectedRecipe, ingredients)
    const profit = calculateProfit(selectedRecipe, ingredients)
    const profitPercentage = calculateProfitPercentage(selectedRecipe, ingredients)

    // Calculate total cost of ONLY ingredients used in this recipe
    const totalRecipeIngredientsCost = selectedRecipe.ingredients.reduce((total, recipeIngredient) => {
        const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId);
        return ingredient ? total + (getIngredientCostPerUnit(ingredient) * recipeIngredient.amount) : total;
    }, 0);

    // Calculate batches needed
    const earningsPerLot = selectedRecipe.sellingPrice * selectedRecipe.batchSize;
    const metaLotes = Math.ceil(totalRecipeIngredientsCost / earningsPerLot);

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
                                <div className="flex items-center bg-white border-2 border-amber-300 rounded-lg p-1 ml-2 sm:ml-4 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200 shadow-sm">
                                    <button
                                        type="button"
                                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center bg-amber-50 text-amber-700 rounded-l-md border-r border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-colors duration-150 group"
                                        onClick={() => {
                                            const newValue = Math.max(0, (selectedRecipe.batchSize - 1) || 0);
                                            updateRecipeBatchSize(newValue);
                                        }}
                                    >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <input
                                        type="number"
                                        value={selectedRecipe.batchSize}
                                        onChange={(e) => {
                                            const value = Math.max(1, Math.min(1000, Number(e.target.value) || 1))
                                            updateRecipeBatchSize(value)
                                        }}
                                        className="w-8 sm:w-10 md:w-12 lg:w-14 px-1 sm:px-2 py-1 text-xs sm:text-sm md:text-base text-center font-bold flip-card-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="1"
                                        max="1000"
                                    />
                                    <button
                                        type="button"
                                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center bg-amber-50 text-amber-700 rounded-r-md border-l border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-colors duration-150 group"
                                        onClick={() => {
                                            const newValue = (selectedRecipe.batchSize + 1) || 1;
                                            updateRecipeBatchSize(newValue);
                                        }}
                                    >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                <span className="text-lg font-semibold text-blue-700">Precio de venta</span>
                                <div className="flex items-center bg-white border-2 border-green-300 rounded-lg p-1 ml-2 sm:ml-4 hover:border-green-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all duration-200 shadow-sm">
                                    <button
                                        type="button"
                                        className="w-4 h-6 sm:w-5 sm:h-7 md:w-6 md:h-8 flex items-center justify-center bg-green-50 text-green-700 rounded-l-md border-r border-green-200 hover:bg-green-100 active:bg-green-200 transition-colors duration-150 group"
                                        onClick={() => {
                                            const newValue = Math.max(0, (selectedRecipe.sellingPrice - 1) || 0);
                                            updateRecipeSellingPrice(newValue);
                                        }}
                                    >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <input
                                        type="number"
                                        value={selectedRecipe.sellingPrice}
                                        onChange={(e) => {
                                            const value = Math.max(0, Math.min(10000, Number(e.target.value) || 0))
                                            updateRecipeSellingPrice(value)
                                        }}
                                        className="w-12 sm:w-14 md:w-16 p-1 text-xs sm:text-sm md:text-base text-center text-green-600 font-bold flip-card-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="0"
                                        max="10000"
                                        step="0.01"
                                    />
                                    <button
                                        type="button"
                                        className="w-4 h-6 sm:w-5 sm:h-7 md:w-6 md:h-8 flex items-center justify-center bg-green-50 text-green-700 rounded-r-md border-l border-green-200 hover:bg-green-100 active:bg-green-200 transition-colors duration-150 group"
                                        onClick={() => {
                                            const newValue = (selectedRecipe.sellingPrice + 1) || 1;
                                            updateRecipeSellingPrice(newValue);
                                        }}
                                    >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
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


                    {/* Mobile Production Registration */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">Registrar Producción</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-purple-700">Lotes producidos</span>
                                <input
                                    type="number"
                                    value={productionBatchCount}
                                    onChange={(e) => setProductionBatchCount(Number(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 border-2 border-purple-300 rounded-lg text-lg font-bold text-center"
                                    min="1"
                                />
                            </div>
                            <Button
                                onClick={handleRecordProduction}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Registrar Producción
                            </Button>
                            <div className="text-center text-sm text-purple-600">
                                Total: {productionBatchCount * selectedRecipe.batchSize} unidades
                            </div>
                        </div>
                    </div>


                    {/*    Agregar Ingredientes*/}
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


                    {/* Add Tools Toggle for Mobile */}
                    <div className="bg-white border-2 border-blue-300 rounded-xl p-3 cursor-pointer hover:bg-blue-50 transition-colors col-span-2"
                        onClick={() => setShowAddTools(!showAddTools)}>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">Herramientas</div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {selectedRecipe.tools?.length || 0}
                                </span>
                                <svg
                                    className={`w-4 h-4 text-blue-600 transition-transform duration-300 ${showAddTools ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Tools Section - Show when toggled */}
                    {showAddTools && (
                        <div className="col-span-2 space-y-3 mt-2">
                            {/* Add Tools */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-700">Agregar Herramientas</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        {tools.filter(tool => !selectedRecipe.tools?.find(rt => rt.toolId === tool.id)).length} disponibles
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tools
                                        .filter(tool => !selectedRecipe.tools?.find(rt => rt.toolId === tool.id))
                                        .map(tool => (
                                            <button
                                                key={tool.id}
                                                onClick={() => addToolToRecipe(tool.id)}
                                                className="flex items-center gap-1 bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs hover:bg-blue-50 transition-colors"
                                            >
                                                <Plus className="h-3 w-3 text-blue-600" />
                                                {tool.name}
                                            </button>
                                        ))}
                                    {tools.filter(tool => !selectedRecipe.tools?.find(rt => rt.toolId === tool.id)).length === 0 && (
                                        <div className="text-xs text-green-600 w-full text-center py-1">
                                            Todas agregadas
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Current Tools */}
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-indigo-700">Herramientas Actuales</span>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                        {selectedRecipe.tools?.length || 0}
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {selectedRecipe.tools?.map((recipeTool) => {
                                        const tool = tools.find(t => t.id === recipeTool.toolId)
                                        if (!tool) return null

                                        return (
                                            <div key={recipeTool.toolId} className="flex items-center justify-between bg-white border border-indigo-200 rounded-lg px-2 py-1">
                                                <span className="text-xs font-medium">{tool.name}</span>
                                                <button
                                                    onClick={() => removeToolFromRecipe(recipeTool.toolId)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                    {(!selectedRecipe.tools || selectedRecipe.tools.length === 0) && (
                                        <div className="text-xs text-gray-500 text-center py-1">
                                            No hay herramientas
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Mobile Cost Summary */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-green-800 mb-4 text-center">Resumen de Costos</h3>

                        <div className="grid grid-cols-2 gap-4 text-center max-h-55 overflow-y-auto pr-2">
                            <div className="bg-white border-2 border-red-200 rounded-xl p-3 cursor-pointer hover:bg-red-50 transition-colors"
                                onClick={() => setShowUnitCostModal(true)}>
                                <div className="text-sm text-gray-600">Costo/Unidad</div>
                                <div className="text-lg font-bold text-red-700">${costPerItem.toFixed(2)}</div>
                            </div>

                            {/* <div className="bg-white border-2 border-green-200 rounded-xl p-3 cursor-pointer hover:bg-green-50 transition-colors"
                                onClick={() => setShowProfitModal(true)}>
                                <div className="text-sm text-gray-600">Precio de Venta</div>
                                <div className="text-lg font-bold text-green-700">${(selectedRecipe.sellingPrice)}</div>
                            </div> */}

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3 cursor-pointer hover:bg-green-50 transition-colors"
                                onClick={() => setShowProfitModal(true)}>
                                <div className="text-sm text-gray-600">Ganancia por Unidad</div>
                                <div className="text-lg font-bold text-green-600">${profit.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-blue-200 rounded-xl p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                                onClick={() => setShowMarginModal(true)}>
                                <div className="text-sm text-gray-600">Margen %</div>
                                <div className="text-lg font-bold text-blue-600">{profitPercentage.toFixed(1)}%</div>
                            </div>

                            <div className="bg-white border-2 border-purple-200 rounded-xl p-3 cursor-pointer hover:bg-purple-50 transition-colors"
                                onClick={() => setShowCostModal(true)}>
                                <div className="text-sm text-gray-600">Costo Total/Lote</div>
                                <div className="text-lg font-bold text-purple-700">${totalRecipeCost.toFixed(2)}</div>
                            </div>

                            {/* <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Venta de Lote</div>
                                <div className="text-lg font-bold text-green-700">${(selectedRecipe.sellingPrice * selectedRecipe.batchSize).toFixed(2)}</div>
                            </div> */}

                            <div className="flex flex-col gap-4 p-3 col-span-2">
                                <div className="bg-white border-2 border-red-200 rounded-xl p-3 cursor-pointer hover:bg-red-50 transition-colors"
                                    onClick={() => setShowTotalIngredientsModal(true)}>
                                    <div className="text-sm text-gray-600">Costo total de Ingredientes</div>
                                    <div className="text-lg font-bold text-red-700">
                                        ${totalRecipeIngredientsCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-blue-400 rounded-xl p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                                    onClick={() => setShowLotesModal(true)}>
                                    <div className="text-sm text-gray-600">Meta de Lotes</div>
                                    <div className="text-lg font-bold text-blue-700">
                                        {metaLotes}
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-purple-400 rounded-xl p-3">
                                    <div className="text-sm text-gray-600">Ganancia Aproximada</div>
                                    <div className="text-lg font-bold text-purple-700">
                                        {((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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
                                    className="w-full px-4 py-4 border-2 border-amber-500 rounded-xl text-lg font-medium text-amber-700 bg-white flex justify-between items-center shadow-sm hover:bg-amber-200 hover:shadow-md transition-all"
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

                    {/* Add Tools Section - Desktop */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-1">

                        <div
                            className={`flex items-center justify-between ${showAddTools ? "mb-4" : ""}`}
                            onClick={() => setShowAddTools(!showAddTools)}
                        >

                            <h3 className="font-semibold text-blue-800 text-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Agregar Herramientas
                            </h3>
                            <div className="flex items-center " >
                                <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                    {tools.filter(tool => !selectedRecipe.tools?.find(rt => rt.toolId === tool.id)).length} disponibles
                                </div>

                                {/* CHEVRON */}
                                <svg
                                    className={`w-5 h-5 text-blue-700 transition-transform duration-300 ${showAddTools ? "rotate-180" : ""
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {showAddTools && (
                            <div className="flex flex-wrap gap-2">
                                {tools
                                    .filter(tool => !selectedRecipe.tools?.find(rt => rt.toolId === tool.id))
                                    .map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => addToolToRecipe(tool.id)}
                                            className="group relative overflow-hidden bg-white hover:bg-green-50 border border-blue-300 hover:border-blue-400 rounded-lg px-4 py-3 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Plus className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                                                <span className="text-base font-medium text-blue-800 group-hover:text-blue-900">
                                                    {tool.name}
                                                </span>
                                                {tool.cost > 0 && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                        ${tool.cost.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}

                                {tools.filter(tool => !selectedRecipe.tools?.find(rt => rt.toolId === tool.id)).length === 0 && (
                                    <div className="w-full text-center py-2">
                                        <div className="text-green-600 text-base">Todas las herramientas agregadas</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>


                    {/* Recipe Tools */}
                    <div
                        className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-1 
                            }`}
                    >

                        <div
                            className={`flex items-center justify-between ${showRecipeTools ? "mb-4 " : ""}`}
                            onClick={() => setShowRecipeTools(!showRecipeTools)}>
                            <h3 className="font-semibold text-blue-800 text-lg flex items-center gap-2">
                                <Wrench className="h-4 w-4" />

                                Herramientas de la Receta
                            </h3>
                            <div className="flex items-center " >
                                <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                    {selectedRecipe.tools?.length || 0} herramientas
                                </div>

                                {/* CHEVRON */}
                                <svg
                                    className={`w-5 h-5 text-blue-700 transition-transform duration-300 ${showAddTools ? "rotate-180" : ""
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {showRecipeTools && (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {selectedRecipe.tools?.map((recipeTool) => {
                                    const tool = tools.find(t => t.id === recipeTool.toolId)
                                    if (!tool) return null

                                    const cost = tool.cost || 0
                                    const costPercentage = (cost / totalRecipeCost) * 100

                                    return (
                                        <div
                                            key={recipeTool.toolId}
                                            className="group relative bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                                        >
                                            {/* Cost percentage bar */}
                                            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-t-xl"
                                                style={{ width: `${Math.min(costPercentage, 100)}%` }}></div>

                                            <div className="flex items-center justify-between">
                                                {/* Tool Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="font-semibold text-gray-900 text-lg">{tool.name}</div>
                                                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${tool.type === 'consumible' ? 'bg-blue-100 text-blue-800' :
                                                            tool.type === 'herramienta' ? 'bg-green-100 text-green-800' :
                                                                'bg-purple-100 text-purple-800'
                                                            }`}>
                                                            {tool.type}
                                                        </div>
                                                    </div>

                                                    {/* Tool Details */}
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <span>{toolCategories[tool.type]?.find(cat => cat.value === tool.category)?.label || 'General'}</span>
                                                            {tool.description && (
                                                                <span className="text-xs text-gray-500">• {tool.description}</span>
                                                            )}
                                                        </div>

                                                        {/* Cost Display */}
                                                        {cost > 0 && (
                                                            <div className="text-lg font-bold text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-2 min-w-[80px] text-center shadow-sm">
                                                                ${cost.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeToolFromRecipe(recipeTool.toolId)}
                                                    className="opacity-0 group-hover:opacity-100 ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                    title="Eliminar herramienta"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Cost percentage indicator */}
                                            {cost > 0 && (
                                                <div className="mt-2 flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Porcentaje del costo total:</span>
                                                    <span className="font-medium text-blue-700">{costPercentage.toFixed(1)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {(!selectedRecipe.tools || selectedRecipe.tools.length === 0) && (
                                    <div className="text-center py-8">
                                        <div className="text-blue-500 text-sm mb-2">No hay herramientas en esta receta</div>
                                        <div className="text-blue-400 text-xs">Agrega herramientas usando la sección de arriba</div>
                                    </div>
                                )}
                            </div>
                        )}
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
                                <span className=" text-sm text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-normal">
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
                            <div
                                className="bg-white border-2 border-red-200 rounded-xl p-3 text-center cursor-pointer hover:bg-red-50 transition-colors"
                                onClick={() => setShowUnitCostModal(true)}
                            >
                                <div className="text-sm text-gray-600">Costo/Unidad</div>
                                <div className="text-lg font-bold text-red-700">${costPerItem.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3 text-center cursor-pointer hover:bg-green-50 transition-colors"
                                onClick={() => setShowProfitModal(true)}>
                                <div className="text-sm text-gray-600">Ganancia/Unidad</div>
                                <div className="text-lg font-bold text-green-600">${profit.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-blue-200 rounded-xl p-3 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                                onClick={() => setShowMarginModal(true)}>
                                <div className="text-sm text-gray-600">Margen %</div>
                                <div className="text-lg font-bold text-blue-600">{profitPercentage.toFixed(1)}%</div>
                            </div>

                            {/* Clickable Cost Card */}
                            <div
                                className="bg-white border-2 border-purple-200 rounded-xl p-3 text-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                                onClick={() => setShowCostModal(true)}
                            >
                                <div className="text-sm text-gray-600">Costo Total</div>
                                <div className="text-lg font-bold text-purple-700">${totalRecipeCost.toFixed(2)}</div>
                            </div>



                        </div>
                    </div>

                    {/* Cost Summary */}
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-3 text-amber-800 text-2xl text-center">Resumen de Costos</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-center">
                                    <div className="text-gray-600 text-md">Costo Total Lote</div>
                                    <div className="font-bold text-lg">${totalRecipeCost.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600 text-md">Costo por Unidad</div>
                                    <div className="font-bold text-lg">${costPerItem.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600 text-md">Ganancia/Unidad</div>
                                    <div className="font-bold text-lg text-green-600">${profit.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
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
                                    <div
                                        className="bg-white border-2 border-red-200 rounded-xl p-4 cursor-pointer hover:bg-red-50 transition-colors"
                                        onClick={() => setShowTotalIngredientsModal(true)}
                                    >
                                        <div className="text-sm text-gray-600 mb-2">Costo Total Ingredientes</div>
                                        <div className="text-xl font-bold text-red-700">
                                            ${totalRecipeIngredientsCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        </div>
                                    </div>

                                    <div className="bg-white border-2 border-blue-300 rounded-xl p-4 cursor-pointer hover:bg-blue-50 transition-colors"
                                        onClick={() => setShowLotesModal(true)}>
                                        <div className="text-sm text-gray-600 mb-2">Meta de Lotes</div>
                                        <div className="text-xl font-bold text-blue-700">
                                            {metaLotes}
                                        </div>
                                    </div>
                                </div>

                                {/* Profit Goal Input */}
                                <div className="mt-4 bg-white border-2 border-green-200 rounded-xl p-4 text-center cursor-pointer hover:bg-purple-50 transition-colors"
                                    onClick={() => setShowProfitGoalModal(true)}>
                                    <div className="text-sm text-gray-600 mb-2">Ganancia Aproximada</div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-600 text-2xl  font-bold">$</span>
                                        <span className=" text-2xl font-bold text-center font-bold text-green-600">
                                            {((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        </span>
                                    </div>
                                </div>
                            </div>


                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
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

                {/* MOBILE ACTION BUTTONS */}
                <div className="lg:hidden flex flex-col gap-3 pt-4">
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

            {/* Cost Breakdown Modal */}
            {
                showCostModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        {/* Add backdrop click to close */}
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowCostModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">

                            {/* Header */}
                            <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">💰</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-purple-800">Desglose de Costos</h3>
                                            <p className="text-sm text-purple-600">Costo total por ingrediente</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowCostModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 overflow-y-auto max-h-64">
                                {selectedRecipe.ingredients.map((recipeIngredient) => {
                                    const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId);
                                    if (!ingredient) return null;

                                    const cost = getIngredientCostPerUnit(ingredient) * recipeIngredient.amount;
                                    const percentage = (cost / totalRecipeCost) * 100;

                                    return (
                                        <div key={recipeIngredient.ingredientId} className="flex justify-between items-center py-2 border-b">
                                            <div className="flex-1">
                                                <div className="font-medium">{ingredient.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {recipeIngredient.amount} {ingredient.unit} × ${getIngredientCostPerUnit(ingredient).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">${cost.toFixed(2)}</div>
                                                <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-gray-50">
                                <div className="bg-white rounded-lg border p-4 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-900">Total de la Receta:</span>
                                        <span className="text-xl font-bold text-red-700">${totalRecipeIngredientsCost.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {selectedRecipe.ingredients.length} ingrediente{selectedRecipe.ingredients.length !== 1 ? 's' : ''} en esta receta
                                    </div>
                                </div>

                                <ActionButton
                                    onClick={() => setShowCostModal(false)}
                                    color="red"
                                    fullWidth
                                >
                                    Cerrar
                                </ActionButton>

                            </div>
                        </div>
                    </div>
                )
            }

            {/* Unit Cost Breakdown Modal */}
            {
                showUnitCostModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowUnitCostModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">

                            {/* Header */}
                            <div className="p-6 border-b border-red-100 bg-gradient-to-r from-red-50 to-pink-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">📦</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-red-800">Costo por Unidad</h3>
                                            <p className="text-sm text-red-600">Desglose detallado por unidad</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowUnitCostModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-96">
                                <div className="space-y-3">
                                    {selectedRecipe.ingredients.map((recipeIngredient) => {
                                        const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId);
                                        if (!ingredient) return null;

                                        const unitCost = (getIngredientCostPerUnit(ingredient) * recipeIngredient.amount) / selectedRecipe.batchSize;
                                        const percentage = (unitCost / costPerItem) * 100;

                                        return (
                                            <div key={recipeIngredient.ingredientId} className="flex justify-between items-center py-2 border-b">
                                                <div className="flex-1">
                                                    <div className="font-medium">{ingredient.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {recipeIngredient.amount} {ingredient.unit} ÷ {selectedRecipe.batchSize} unidades
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">${unitCost.toFixed(4)}</div>
                                                    <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-gray-50">
                                <div className="bg-white rounded-lg border p-4 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-900">Costo por Unidad:</span>
                                        <span className="text-xl font-bold text-red-700">${costPerItem.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {selectedRecipe.batchSize} unidades por lote
                                    </div>
                                </div>
                                <ActionButton
                                    onClick={() => setShowUnitCostModal(false)}
                                    color="red"
                                    fullWidth
                                >
                                    Cerrar
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Profit Breakdown Modal */}
            {
                showProfitModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        {/* Add backdrop click to close */}
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowProfitModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">
                            {/* Header */}
                            <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">💸</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-800">Análisis de Ganancia</h3>
                                            <p className="text-sm text-green-600">Rentabilidad por unidad y lote</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowProfitModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <div className="text-sm text-gray-600">Costo/Unidad</div>
                                        <div className="text-lg font-bold text-red-700">${costPerItem.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-sm text-gray-600">Precio Venta</div>
                                        <div className="text-lg font-bold text-blue-700">${selectedRecipe.sellingPrice.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">Ganancia por Unidad:</span>
                                        <span className="text-lg font-bold text-green-700">${profit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Margen de Ganancia:</span>
                                        <span className="text-lg font-bold text-green-700">{profitPercentage.toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">Ganancia Total por Lote</div>
                                    <div className="text-lg font-bold text-amber-700">
                                        ${(profit * selectedRecipe.batchSize).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {selectedRecipe.batchSize} unidades × ${profit.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t bg-gray-50">
                                <button
                                    onClick={() => setShowProfitModal(false)}
                                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Margin Analysis Modal */}
            {
                showMarginModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        {/* Add backdrop click to close */}
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowMarginModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">

                            {/* Header */}
                            <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">📊</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-800">Análisis de Margen</h3>
                                            <p className="text-sm text-blue-600">Evaluación de rentabilidad</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowMarginModal(false)} />
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Profitability Indicator */}
                                <div className="text-center">
                                    <div className={`text-lg font-bold ${profitPercentage >= 50 ? 'text-green-600' :
                                        profitPercentage >= 30 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {profitPercentage >= 50 ? '🟢 Excelente' :
                                            profitPercentage >= 30 ? '🟡 Buena' : '🔴 Baja'} Rentabilidad
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>0%</span>
                                        <span>Margen Actual: {profitPercentage.toFixed(1)}%</span>
                                        <span>100%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div
                                            className={`h-4 rounded-full transition-all duration-300 ${profitPercentage >= 50 ? 'bg-green-500' :
                                                profitPercentage >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(profitPercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600">Costo</div>
                                        <div className="font-bold text-red-700">${costPerItem.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600">Ganancia</div>
                                        <div className="font-bold text-green-700">${profit.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600">Precio Venta</div>
                                        <div className="font-bold text-blue-700">${selectedRecipe.sellingPrice.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-600">Por cada $1</div>
                                        <div className="font-bold text-purple-700">${(profitPercentage / 100).toFixed(2)}</div>
                                    </div>
                                </div>

                                {/* Recommendation */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700 mb-1">Recomendación:</div>
                                    <div className="text-xs text-gray-600">
                                        {profitPercentage >= 50 ? '✅ Margen saludable. Mantén este precio.' :
                                            profitPercentage >= 30 ? '⚠️  Margen aceptable. Considera optimizar costos.' :
                                                '❌ Margen bajo. Revisa costos o aumenta precio.'}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-gray-50">
                                <ActionButton
                                    onClick={() => setShowMarginModal(false)}
                                    color="blue"
                                    fullWidth
                                >
                                    Cerrar
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal showing only recipe ingredients */}
            {
                showTotalIngredientsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowTotalIngredientsModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">

                            {/* Header */}
                            <div className="p-6 border-b border-red-100 bg-gradient-to-r from-red-50 to-pink-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">🥘</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-red-800">Ingredientes en Receta</h3>
                                            <p className="text-sm text-red-600">Lista completa de ingredientes</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowTotalIngredientsModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-96">
                                {selectedRecipe.ingredients.map((recipeIngredient) => {
                                    const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId);
                                    if (!ingredient) return null;

                                    return (
                                        <div key={recipeIngredient.ingredientId} className="flex justify-between items-center py-2 border-b">
                                            <div className="flex-1">
                                                <div className="font-medium">{ingredient.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {recipeIngredient.amount} {ingredient.unit}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-red-700">${(getIngredientCostPerUnit(ingredient) * recipeIngredient.amount).toFixed(2)}</div>
                                                <div className="text-sm text-gray-500">
                                                    ${getIngredientCostPerUnit(ingredient).toFixed(2)}/{ingredient.unit}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex justify-between items-center font-bold text-lg mb-2">
                                    <span>Total Receta:</span>
                                    <span className="text-red-700">${totalRecipeIngredientsCost.toFixed(2)}</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-3">
                                    {selectedRecipe.ingredients.length} ingrediente{selectedRecipe.ingredients.length !== 1 ? 's' : ''} en esta receta
                                </div>
                                <button
                                    onClick={() => setShowTotalIngredientsModal(false)}
                                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Lotes Explanation Modal */}
            {
                showLotesModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowLotesModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">
                            {/* Swipe indicator for mobile */}
                            <div className="lg:hidden flex justify-center pt-3 pb-1">
                                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                            </div>

                            {/* Header */}
                            <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">🎯</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-800">Meta de Lotes</h3>
                                            <p className="text-sm text-blue-600">Punto de equilibrio de ingredientes</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowLotesModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4 overflow-y-auto max-h-96">
                                {/* Objective */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-sm font-semibold text-blue-800">Objetivo</div>
                                    </div>
                                    <div className="text-sm text-blue-700">
                                        Vender suficientes lotes para cubrir el costo total de los ingredientes de esta receta.
                                    </div>
                                </div>

                                {/* Calculation Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Costo total ingredientes:</span>
                                        <span className="font-bold text-red-600">${totalRecipeIngredientsCost.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Ingresos por lote:</span>
                                        <span className="font-bold text-green-600">
                                            ${(selectedRecipe.sellingPrice * selectedRecipe.batchSize).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="border-t border-blue-200 pt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-lg font-bold text-blue-700">Lotes necesarios:</span>
                                            <span className="text-2xl font-bold text-blue-700">{metaLotes}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                                            {totalRecipeIngredientsCost.toFixed(2)} ÷ {(selectedRecipe.sellingPrice * selectedRecipe.batchSize).toFixed(2)} = {Math.ceil(totalRecipeIngredientsCost / (selectedRecipe.sellingPrice * selectedRecipe.batchSize))} lotes
                                        </div>
                                    </div>
                                </div>

                                {/* Example */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-sm font-semibold text-green-800">Ejemplo Práctico</div>
                                    </div>
                                    <div className="text-sm text-green-700">
                                        Si vendes <strong>{metaLotes} lotes</strong> de {selectedRecipe.name}, cubrirás el costo de <strong>${totalRecipeIngredientsCost.toFixed(2)}</strong> en ingredientes. Cada lote adicional será <strong>ganancia pura</strong>.
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div className="text-sm font-semibold text-amber-800">Nota Importante</div>
                                    </div>
                                    <div className="text-xs text-amber-700">
                                        Esto solo cubre el costo de ingredientes. No incluye otros gastos como mano de obra, empaque, servicios, o costos operativos.
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-600 mb-1">Ganancia por lote</div>
                                        <div className="text-lg font-bold text-green-600">
                                            ${(profit * selectedRecipe.batchSize).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-600 mb-1">Unidades por lote</div>
                                        <div className="text-lg font-bold text-blue-600">
                                            {selectedRecipe.batchSize}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-gray-50">
                                <ActionButton
                                    onClick={() => setShowLotesModal(false)}
                                    color="blue"
                                    fullWidth
                                >
                                    Entendido
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Approximate Profit Modal */}
            {
                showProfitGoalModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowProfitGoalModal(false)}
                        />
                        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden relative z-10">

                            {/* Header */}
                            <div className="p-6 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-800">Ganancia Aproximada</h3>
                                            <p className="text-sm text-green-600">Proyección de ganancias potenciales</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowProfitGoalModal(false)}
                                        className="w-8 h-8 flex items-center justify-center text-green-500 hover:text-green-700 hover:bg-green-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                                {/* Key Metrics Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                        <div className="text-xs font-medium text-blue-600 mb-1">Meta de Lotes</div>
                                        <div className="text-2xl font-bold text-blue-700">{metaLotes}</div>
                                        <div className="text-xs text-blue-500 mt-1">para cubrir costos</div>
                                    </div>

                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                        <div className="text-xs font-medium text-purple-600 mb-1">Ganancia Total</div>
                                        <div className="text-2xl font-bold text-purple-700">
                                            ${((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-purple-500 mt-1">aproximada</div>
                                    </div>
                                </div>

                                {/* Breakdown Section */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Desglose de Proyección
                                    </h4>

                                    {/* Investment */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-red-700">Inversión en Ingredientes</span>
                                            <span className="text-lg font-bold text-red-700">${totalRecipeIngredientsCost.toFixed(2)}</span>
                                        </div>
                                        <div className="text-xs text-red-600">
                                            Costo total de todos los ingredientes de la receta
                                        </div>
                                    </div>

                                    {/* Revenue Projection */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-green-700">Ingresos por {metaLotes} lotes</span>
                                            <span className="text-lg font-bold text-green-700">
                                                ${(selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-green-600">
                                            {metaLotes} lotes × ${selectedRecipe.sellingPrice.toFixed(2)}/unidad × {selectedRecipe.batchSize} unidades
                                        </div>
                                    </div>

                                    {/* Net Profit */}
                                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 border border-green-500 rounded-lg p-4 text-white">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">Ganancia Neta Aproximada</span>
                                            <span className="text-xl font-bold">
                                                ${((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs opacity-90">
                                            Después de recuperar la inversión en ingredientes
                                        </div>
                                    </div>
                                </div>

                                {/* Profitability Indicator */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">Rentabilidad del Proyecto</span>
                                        <span className={`text-sm font-bold ${profitPercentage >= 50 ? 'text-green-600' :
                                            profitPercentage >= 30 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {profitPercentage >= 50 ? '🟢 Excelente' :
                                                profitPercentage >= 30 ? '🟡 Buena' : '🔴 Moderada'}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span>0%</span>
                                            <span className="font-medium">
                                                Retorno: {((((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost) / totalRecipeIngredientsCost) * 100).toFixed(1)}%
                                            </span>
                                            <span>Máx</span>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-3 relative">
                                            <div
                                                className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        Math.log10(
                                                            ((((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost) / totalRecipeIngredientsCost) * 100) / 10 + 1
                                                        ) * 100,
                                                        100
                                                    )}%`
                                                }}
                                            ></div>
                                        </div>

                                        <div className="text-xs text-gray-500 text-center">
                                            {((((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost) / totalRecipeIngredientsCost) * 100) > 200 ? '🔥 Retorno extraordinario' :
                                                ((((selectedRecipe.sellingPrice * selectedRecipe.batchSize * metaLotes) - totalRecipeIngredientsCost) / totalRecipeIngredientsCost) * 100) > 100 ? '⭐ Alto retorno' :
                                                    'Escala logarítmica'}
                                        </div>
                                    </div>
                                </div>

                                {/* Key Insights */}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Puntos Clave
                                    </h5>
                                    <ul className="space-y-2 text-sm text-amber-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            <span>Vender <strong>{metaLotes} lotes</strong> cubre tu inversión inicial</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            <span>Cada lote adicional genera <strong>${(profit * selectedRecipe.batchSize).toFixed(2)}</strong> de ganancia pura</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            <span>Tu margen por unidad es <strong>{profitPercentage.toFixed(1)}%</strong> (${profit.toFixed(2)})</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-6 border-t border-gray-200 bg-gray-50">
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowProfitGoalModal(false)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Entendido
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowProfitGoalModal(false);
                                            setShowLotesModal(true);
                                        }}
                                        className="w-full bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg border border-gray-300 font-medium transition-colors duration-200 text-sm"
                                    >
                                        Ver detalles de la meta de lotes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </Card >
    )
}