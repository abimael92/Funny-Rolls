"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChefHat, Edit, FlipHorizontal, Plus, Save, Trash2, CheckCircle } from "lucide-react"
import Image from "next/image"
import { getProducts } from "@/lib/services"
import { Recipe } from '@/lib/types'
import { CustomNumberInput } from './CustomNumberInput'
import { useState } from "react"  // Add this import

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
    const product = getProducts().find(p => p.name === selectedRecipe.name)
    const steps = selectedRecipe.steps || []

    // Add state for completed steps
    const [completedSteps, setCompletedSteps] = useState<number[]>([])

    // Toggle step completion
    const toggleStepCompletion = (index: number) => {
        if (isEditingSteps) return // Don't allow completion during editing

        setCompletedSteps(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        )
    }

    // Check if step is completed
    const isStepCompleted = (index: number) => completedSteps.includes(index)

    return (
        <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 perspective-1000 flip-card-container">
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''
                    } flip-card-mobile`}
            >
                {/* Front Side - Roll Info */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 h-full">
                        <CardContent className="p-3 sm:p-4 md:p-6 h-full flex flex-col flip-card-content">
                            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                                    <ChefHat className="h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8 text-amber-800" />
                                    <h3 className="font-semibold text-amber-800 text-lg sm:text-xl md:text-2xl flip-card-header-text">Vista del Rollo</h3>
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

                            <div className="flex flex-col mx-12 px-8 lg:flex-row items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-1">
                                {/* Roll Image */}
                                <div className="flex-shrink-0 mr-8 lg:mr-4">
                                    <div className="relative">
                                        {product?.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                width={184}
                                                height={184}
                                                fill={false}
                                                className="rounded-full border-4 border-amber-300 object-cover w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-48 lg:h-48 flip-card-image focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-50 shadow-2xl"
                                                sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 112px, 144px"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-48 lg:h-48 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 border-4 border-amber-300 text-xs flip-card-image">
                                                Sin imagen
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Roll Details */}
                                <div className="flex-1 w-full text-center px-8 lg:text-left">
                                    <h4 className="font-cursive text-base sm:text-lg md:text-xl lg:text-2xl text-amber-700 mb-2 sm:mb-3 md:mb-4">{selectedRecipe.name}</h4>
                                    <div className="space-y-1 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 text-left font-medium">Lote:<br className="hidden sm:block" />(unidades)</span>
                                            <div className="flex items-center bg-white border-2 border-amber-300 rounded-lg p-1 ml-2 sm:ml-4 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200 shadow-sm">

                                                <CustomNumberInput
                                                    value={selectedRecipe.batchSize}
                                                    onChange={(value) => updateRecipeBatchSize(value)}
                                                    allowDecimals={false}
                                                    className="w-full"
                                                    min={0}
                                                    max={10000}
                                                    placeholder="Lote"
                                                    color='amber'
                                                />

                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Precio:</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-600 text-xs sm:text-sm md:text-base">$</span>

                                                <div className="flex items-center bg-white border-2 border-green-300 rounded-lg p-1 ml-2 sm:ml-4 hover:border-green-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all duration-200 shadow-sm">
                                                    <CustomNumberInput
                                                        value={selectedRecipe.sellingPrice}
                                                        onChange={(value) => updateRecipeSellingPrice(value)}
                                                        allowDecimals={false}
                                                        className="w-full"
                                                        min={0}
                                                        max={10000}
                                                        placeholder="Precio"
                                                        color='green'
                                                    />
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
                                    <div
                                        key={index}
                                        className={`flex items-start justify-between p-1 sm:p-2 md:p-3 border rounded-lg bg-white step-item-mobile transition-all duration-200 cursor-pointer ${isStepCompleted(index)
                                            ? 'bg-blue-50 border-blue-200 opacity-75'
                                            : 'hover:bg-blue-50 hover:border-blue-300'
                                            } ${!isEditingSteps ? 'hover:shadow-sm' : ''}`}
                                        onClick={() => !isEditingSteps && toggleStepCompletion(index)}
                                    >
                                        <div className="flex-1 flex items-start gap-1 sm:gap-2 min-w-0">
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                {!isEditingSteps && (
                                                    <div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isStepCompleted(index)
                                                        ? 'bg-blue-500 border-blue-500 text-white'
                                                        : 'border-blue-400 text-transparent hover:border-blue-500'
                                                        }`}>
                                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </div>
                                                )}
                                                <span className={`text-xs font-medium mt-0.5 flex-shrink-0 ${isStepCompleted(index) ? 'text-blue-600' : 'text-blue-600'
                                                    }`}>
                                                    {index + 1}.
                                                </span>
                                            </div>
                                            {isEditingSteps ? (
                                                <input
                                                    type="text"
                                                    value={step}
                                                    maxLength={200}
                                                    onChange={(e) => updateStep(index, e.target.value.slice(0, 200))}
                                                    className="flex-1 px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm bg-white min-w-0 flip-card-input"
                                                />
                                            ) : (
                                                <span className={`text-xs sm:text-sm break-words step-text-mobile transition-all ${isStepCompleted(index)
                                                    ? 'line-through text-gray-500'
                                                    : 'text-gray-800'
                                                    }`}>
                                                    {step}
                                                </span>
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