"use client"

import { forwardRef } from 'react'
import { Ingredient, Recipe } from '@/lib/types'
import {
    calculateRecipeCost,
    calculateCostPerItem,
    calculateProfit,
    calculateProfitPercentage,
    getIngredientCostPerUnit
} from '@/lib/utils'

interface PrintableRecipeProps {
    selectedRecipe: Recipe
    ingredients: Ingredient[]
}

export const PrintableRecipe = forwardRef<HTMLDivElement, PrintableRecipeProps>(
    ({ selectedRecipe, ingredients }, ref) => {
        // Calculate costs here so they're available for printing
        const costPerItem = calculateCostPerItem(selectedRecipe, ingredients)
        const totalRecipeCost = calculateRecipeCost(selectedRecipe, ingredients)
        const profit = calculateProfit(selectedRecipe, ingredients)
        const profitPercentage = calculateProfitPercentage(selectedRecipe, ingredients)

        return (
            <div ref={ref} className="p-6 bg-white w-[210mm] min-h-[297mm]">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-amber-800">{selectedRecipe.name}</h1>
                    <p className="text-gray-600">Receta generada el {new Date().toLocaleDateString()}</p>
                </div>

                {/* Cost Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-amber-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Costo por Unidad</div>
                        <div className="font-bold text-lg">${costPerItem.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Precio de Venta</div>
                        <div className="font-bold text-lg">${selectedRecipe.sellingPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Ganancia</div>
                        <div className="font-bold text-lg text-green-600">${profit.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Margen</div>
                        <div className="font-bold text-lg text-green-600">{profitPercentage.toFixed(1)}%</div>
                    </div>
                </div>

                {/* Ingredients */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Ingredientes</h2>
                    <div className="space-y-2">
                        {selectedRecipe.ingredients.map((recipeIngredient) => {
                            const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId);
                            if (!ingredient) return null;

                            const cost = getIngredientCostPerUnit(ingredient) * recipeIngredient.amount;

                            return (
                                <div key={recipeIngredient.ingredientId} className="flex justify-between border-b pb-2">
                                    <div>
                                        <span className="font-medium">{ingredient.name}</span>
                                        <span className="text-sm text-gray-600 ml-2">
                                            ({recipeIngredient.amount} {ingredient.unit})
                                        </span>
                                    </div>
                                    <span className="font-medium">${cost.toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Steps */}
                {selectedRecipe.steps.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">Preparación</h2>
                        <ol className="list-decimal list-inside space-y-2">
                            {selectedRecipe.steps.map((step, index) => (
                                <li key={index} className="pb-2">{step}</li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
                    <p>Costo total del lote: ${totalRecipeCost.toFixed(2)}</p>
                    <p>Tamaño del lote: {selectedRecipe.batchSize} unidades</p>
                </div>
            </div>
        )
    }
)

PrintableRecipe.displayName = 'PrintableRecipe'