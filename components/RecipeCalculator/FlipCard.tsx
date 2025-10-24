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
        <div className="relative w-full h-80 perspective-1000">
            {/* Flip Container */}
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''
                    }`}
            >
                {/* Front Side - Roll Info */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 h-full">
                        <CardContent className="p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <ChefHat className="h-6 w-6 text-amber-600" />
                                    <h3 className="font-semibold text-amber-800">Vista del Rollo</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCardFlipped(true)}
                                        className="text-amber-600 border-amber-300"
                                    >
                                        <FlipHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row items-center gap-6 flex-1">
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
                                            <span className="text-gray-600">Lote:<br />(unidades)</span>
                                            <span className="font-semibold">
                                                <input
                                                    type="number"
                                                    value={selectedRecipe.batchSize}
                                                    onChange={(e) => updateRecipeBatchSize(Number(e.target.value) || 1)}
                                                    className="w-18 px-3 py-2 border rounded text-sm"
                                                />
                                                {' '}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Precio:</span>
                                            <span className="font-semibold text-green-600">${' '}
                                                <input
                                                    type="number"
                                                    value={selectedRecipe.sellingPrice}
                                                    onChange={(e) => updateRecipeSellingPrice(Number(e.target.value) || 0)}
                                                    className="w-18 px-3 py-2 border rounded text-sm"
                                                />
                                            </span>
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
                </div>

                {/* Back Side - Recipe Steps */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 h-full">
                        <CardContent className="p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <ChefHat className="h-6 w-6 text-blue-600" />
                                    <h3 className="font-semibold text-blue-800">Pasos de Preparación</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditingSteps ? (
                                        <Button
                                            onClick={saveSteps}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            Guardar
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsEditingSteps(true)}
                                            className="text-blue-600 border-blue-300"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCardFlipped(false)}
                                        className="text-blue-600 border-blue-300"
                                    >
                                        <FlipHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 overflow-y-auto">
                                {steps.map((step, index) => (
                                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg bg-white">
                                        <div className="flex-1 flex items-start gap-2">
                                            <span className="text-sm font-medium text-blue-600 mt-0.5">{index + 1}.</span>
                                            {isEditingSteps ? (
                                                <input
                                                    type="text"
                                                    value={step}
                                                    onChange={(e) => updateStep(index, e.target.value)}
                                                    className="flex-1 px-2 py-1 border rounded text-sm bg-white"
                                                />
                                            ) : (
                                                <span className="text-sm">{step}</span>
                                            )}
                                        </div>
                                        {isEditingSteps && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeStep(index)}
                                                className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                {isEditingSteps && (
                                    <div className="flex gap-2 mt-4">
                                        <input
                                            type="text"
                                            placeholder="Agregar nuevo paso..."
                                            value={newStep}
                                            onChange={(e) => setNewStep(e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded text-sm"
                                        />
                                        <Button onClick={addStep} className="bg-blue-600 hover:bg-blue-700">
                                            <Plus className="h-4 w-4" />
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