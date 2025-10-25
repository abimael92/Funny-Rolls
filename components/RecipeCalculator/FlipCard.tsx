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

    // Add safety check for steps
    const steps = selectedRecipe.steps || []


    return (
        <div className="relative w-full h-64 sm:h-72 md:h-80 perspective-1000 flip-card-container">
            {/* Flip Container */}
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''
                    } flip-card-mobile`}
            >
                {/* Front Side - Roll Info */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 h-full">
                        <CardContent className="p-4 sm:p-6 h-full flex flex-col flip-card-content">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                    <h3 className="font-semibold text-amber-800 text-sm sm:text-base flip-card-header-text">Vista del Rollo</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCardFlipped(true)}
                                    className="text-amber-600 border-amber-300 h-8 w-8 sm:h-9 sm:w-9 p-0 flip-card-button"
                                >
                                    <FlipHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </div>

                            <div className="flex flex-col lg:flex-row items-center gap-3 sm:gap-4 md:gap-6 flex-1">
                                {/* Roll Image */}
                                <div className="flex-1 flex justify-center">
                                    <div className="relative">
                                        {product?.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                width={160}
                                                height={160}
                                                className="rounded-full shadow-lg border-4 border-amber-300 object-cover w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 flip-card-image"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 border-4 border-amber-300 text-xs flip-card-image">
                                                Sin imagen
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Roll Details */}
                                <div className="flex-1 w-full text-center lg:text-left">
                                    <h4 className="font-cursive text-base sm:text-lg md:text-xl text-amber-700 mb-2 sm:mb-3">{selectedRecipe.name}</h4>
                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-left">Lote:<br className="hidden sm:block" />(unidades)</span>
                                            <input
                                                type="number"
                                                value={selectedRecipe.batchSize}
                                                onChange={(e) => updateRecipeBatchSize(Number(e.target.value) || 1)}
                                                className="w-14 sm:w-16 px-2 py-1 border rounded text-sm flip-card-input"
                                                min="1"
                                            />
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Precio:</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-600 text-sm">$</span>
                                                <input
                                                    type="number"
                                                    value={selectedRecipe.sellingPrice}
                                                    onChange={(e) => updateRecipeSellingPrice(Number(e.target.value) || 0)}
                                                    className="w-14 sm:w-16 px-2 py-1 border rounded text-sm flip-card-input"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Costo:</span>
                                            <span className="font-semibold text-sm">${costPerItem.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Ganancia:</span>
                                            <span className="font-semibold text-green-600 text-sm">${profit.toFixed(2)}</span>
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
                        <CardContent className="p-4 sm:p-6 h-full flex flex-col flip-card-content">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                    <h3 className="font-semibold text-blue-800 text-sm sm:text-base flip-card-header-text">Pasos de Preparación</h3>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    {isEditingSteps ? (
                                        <Button
                                            onClick={saveSteps}
                                            className="bg-green-600 hover:bg-green-700 h-8 px-2 sm:px-3 text-xs flip-card-button"
                                        >
                                            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                            <span className="button-text-mobile sm:inline">Guardar</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsEditingSteps(true)}
                                            className="text-blue-600 border-blue-300 h-8 px-2 sm:px-3 text-xs flip-card-button"
                                        >
                                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                            <span className="button-text-mobile sm:inline">Editar</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCardFlipped(false)}
                                        className="text-blue-600 border-blue-300 h-8 w-8 sm:h-9 sm:w-9 p-0 flip-card-button"
                                    >
                                        <FlipHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 overflow-y-auto max-h-28 sm:max-h-36 md:max-h-44 steps-container flip-card-steps">
                                {steps.map((step, index) => (
                                    <div key={index} className="flex items-start justify-between p-2 sm:p-3 border rounded-lg bg-white step-item-mobile">
                                        <div className="flex-1 flex items-start gap-2 min-w-0">
                                            <span className="text-xs sm:text-sm font-medium text-blue-600 mt-0.5 flex-shrink-0">{index + 1}.</span>
                                            {isEditingSteps ? (
                                                <input
                                                    type="text"
                                                    value={step}
                                                    onChange={(e) => updateStep(index, e.target.value)}
                                                    className="flex-1 px-2 py-1 border rounded text-xs sm:text-sm bg-white min-w-0 flip-card-input"
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
                                                className="text-red-500 hover:text-red-700 flex-shrink-0 ml-1 h-6 w-6 p-0 flip-card-button"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                {isEditingSteps && (
                                    <div className="flex gap-2 mt-3">
                                        <input
                                            type="text"
                                            placeholder="Agregar nuevo paso..."
                                            value={newStep}
                                            onChange={(e) => setNewStep(e.target.value)}
                                            className="flex-1 px-2 py-1 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm flip-card-input"
                                        />
                                        <Button
                                            onClick={addStep}
                                            className="bg-blue-600 hover:bg-blue-700 h-8 w-8 sm:h-10 sm:w-10 p-0 flip-card-button"
                                        >
                                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
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

