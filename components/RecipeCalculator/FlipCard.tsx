"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChefHat, Edit, FlipHorizontal, Plus, Save, Trash2 } from "lucide-react"
import Image from "next/image"
import { products } from "@/lib/data"
import { Recipe } from '@/lib/types'

interface FlipCardProps {
    selectedRecipe: Recipe
    costPerItem: number
    profit: number
    updateRecipeBatchSize: (size: number) => void
    updateRecipeSellingPrice: (price: number) => void
    isCardFlipped: boolean
    setIsCardFlipped: (flipped: boolean) => void
    isEditingSteps: boolean
    setIsEditingSteps: (editing: boolean) => void
    newStep: string
    setNewStep: (step: string) => void
    updateStep: (index: number, step: string) => void
    removeStep: (index: number) => void
    addStep: () => void
    saveSteps: () => void
}

export function FlipCard({
    selectedRecipe,
    costPerItem,
    profit,
    updateRecipeBatchSize,
    updateRecipeSellingPrice,
    isCardFlipped,
    setIsCardFlipped,
    isEditingSteps,
    setIsEditingSteps,
    newStep,
    setNewStep,
    updateStep,
    removeStep,
    addStep,
    saveSteps
}: FlipCardProps) {
    const product = products.find(p => p.name === selectedRecipe.name)

    const steps = selectedRecipe.steps || []

    return (
        <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 perspective-1000 flip-card-container">
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''
                    } flip-card-mobile`}
            >
                {/* Front Side - Roll Info */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 h-full">
                        <CardContent className="p-2 sm:p-3 md:p-4 h-full flex flex-col flip-card-content">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                                    <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600" />
                                    <h3 className="font-semibold text-amber-800 text-xs sm:text-sm md:text-base flip-card-header-text">Vista del Rollo</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCardFlipped(true)}
                                    className="text-amber-600 border-amber-300 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 flip-card-button"
                                >
                                    <FlipHorizontal className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                                </Button>
                            </div>

                            <div className="flex flex-col lg:flex-row items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-1">
                                {/* Roll Image */}
                                <div className="flex-1 flex justify-center">
                                    <div className="relative">
                                        {product?.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                width={160}
                                                height={160}
                                                className="rounded-full shadow-lg border-4 border-amber-300 object-cover w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 flip-card-image"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 border-4 border-amber-300 text-xs flip-card-image">
                                                Sin imagen
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Roll Details */}
                                <div className="flex-1 w-full text-center lg:text-left">
                                    <h4 className="font-cursive text-base sm:text-lg md:text-xl lg:text-2xl text-amber-700 mb-2 sm:mb-3 md:mb-4">{selectedRecipe.name}</h4>
                                    <div className="space-y-1 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 text-left font-medium">Lote:<br className="hidden sm:block" />(unidades)</span>
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

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Precio:</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-600 text-xs sm:text-sm md:text-base">$</span>
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
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-700 font-medium">Costo:</span>
                                            <span className="font-bold text-xs sm:text-sm md:text-base">${costPerItem.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 font-medium">Ganancia:</span>
                                            <span className="font-bold text-green-600 text-xs sm:text-sm md:text-base">${profit.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Back Side - Recipe Steps */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 h-full">
                        <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6 h-full flex flex-col flip-card-content">
                            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                                <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                                    <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                                    <h3 className="font-semibold text-blue-800 text-xs sm:text-sm md:text-base flip-card-header-text">Pasos de Preparación</h3>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    {isEditingSteps ? (
                                        <Button
                                            onClick={saveSteps}
                                            className="bg-green-600 hover:bg-green-700 h-6 sm:h-7 md:h-8 px-2 sm:px-3 text-xs flip-card-button"
                                        >
                                            <Save className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1" />
                                            <span className="button-text-mobile">Guardar</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsEditingSteps(true)}
                                            className="text-blue-600 border-blue-300 h-6 sm:h-7 md:h-8 px-2 sm:px-3 text-xs flip-card-button"
                                        >
                                            <Edit className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1" />
                                            <span className="button-text-mobile">Editar</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCardFlipped(false)}
                                        className="text-blue-600 border-blue-300 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 flip-card-button"
                                    >
                                        <FlipHorizontal className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1 sm:space-y-2 flex-1 overflow-y-auto max-h-20 sm:max-h-24 md:max-h-32 lg:max-h-44 steps-container flip-card-steps">
                                {steps.map((step, index) => (
                                    <div key={index} className="flex items-start justify-between p-1 sm:p-2 md:p-3 border rounded-lg bg-white step-item-mobile">
                                        <div className="flex-1 flex items-start gap-1 sm:gap-2 min-w-0">
                                            <span className="text-xs font-medium text-blue-600 mt-0.5 flex-shrink-0">{index + 1}.</span>
                                            {isEditingSteps ? (
                                                <input
                                                    type="text"
                                                    value={step}
                                                    maxLength={200}
                                                    onChange={(e) => updateStep(index, e.target.value.slice(0, 200))}
                                                    className="flex-1 px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm bg-white min-w-0 flip-card-input"
                                                />
                                            ) : (
                                                <span className="text-xs sm:text-sm break-words step-text-mobile">{step}</span>
                                            )}
                                        </div>
                                        {isEditingSteps && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeStep(index)}
                                                className="text-red-500 hover:text-red-700 flex-shrink-0 ml-1 h-5 w-5 sm:h-6 sm:w-6 p-0 flip-card-button"
                                            >
                                                <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                {isEditingSteps && (
                                    <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3">
                                        <input
                                            type="text"
                                            placeholder="Agregar nuevo paso..."
                                            value={newStep}
                                            maxLength={200}
                                            onChange={(e) => setNewStep(e.target.value.slice(0, 200))}
                                            className="flex-1 px-1 sm:px-2 md:px-3 py-1 sm:py-2 border rounded text-xs sm:text-sm flip-card-input"
                                        />
                                        <Button
                                            onClick={addStep}
                                            className="bg-blue-600 hover:bg-blue-700 h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 p-0 flip-card-button"
                                        >
                                            <Plus className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}