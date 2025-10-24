"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Plus, Trash2, Edit } from "lucide-react"
import { Ingredient } from '@/lib/types'
import { getIngredientCostPerUnit } from '@/lib/utils'
import { EditableIngredientRow } from './EditableIngredientRow'

interface IngredientsPanelProps {
    ingredients: Ingredient[]
    setIngredients: (ingredients: Ingredient[]) => void
}

export function IngredientsPanel({ ingredients, setIngredients }: IngredientsPanelProps) {
    const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null)
    const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'id'>>({
        name: '', price: 0, unit: '', amount: 1
    })

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

    // Save edited ingredient
    const saveEditedIngredient = (updatedIngredient: Ingredient) => {
        setIngredients(ingredients.map(ing =>
            ing.id === updatedIngredient.id ? updatedIngredient : ing
        ))
        setEditingIngredientId(null)
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5" />
                    Ingredientes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add New Ingredient */}
                <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-300 mb-8">
                    <h3 className="font-semibold text-sm text-amber-800">Agregar Ingrediente</h3>
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Nombre del ingrediente"
                            value={newIngredient.name}
                            onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="Unidad"
                                value={newIngredient.unit}
                                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Precio"
                                value={newIngredient.price === 0 ? '' : newIngredient.price}
                                onChange={(e) => setNewIngredient({ ...newIngredient, price: Number(e.target.value) || 0 })}
                                className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Cantidad"
                                value={newIngredient.amount === 1 ? '' : newIngredient.amount}
                                onChange={(e) => setNewIngredient({ ...newIngredient, amount: Number(e.target.value) || 1 })}
                                className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <Button onClick={addIngredient} className="w-full bg-amber-600 hover:bg-amber-700 text-sm py-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Ingrediente
                    </Button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center my-6">
                    <div className="flex-grow border-t border-amber-300"></div>
                    <span className="mx-3 text-amber-600 text-md font-medium">Ingredientes</span>
                    <div className="flex-grow border-t border-amber-300"></div>
                </div>

                {/* Ingredients List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {ingredients.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-amber-50 transition-colors">
                            {editingIngredientId === ingredient.id ? (
                                <EditableIngredientRow
                                    ingredient={ingredient}
                                    onSave={saveEditedIngredient}
                                    onCancel={() => setEditingIngredientId(null)}
                                />
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-900 mb-1">{ingredient.name}</div>
                                        <div className="flex flex-wrap gap-4 text-xs">
                                            <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                ${ingredient.price} / {ingredient.amount} {ingredient.unit}
                                            </span>
                                            <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded font-medium">
                                                ${getIngredientCostPerUnit(ingredient).toFixed(2)} por {ingredient.unit}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingIngredientId(ingredient.id)}
                                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1"
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeIngredient(ingredient.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}