"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, ChevronDown, Plus, Trash2, Edit } from "lucide-react"
import { Ingredient, InventoryItem } from '@/lib/types'
import { getIngredientCostPerUnit } from '@/lib/utils'
import { UnitConverter } from '../../lib/unit-conversion';
import { EditableIngredientRow } from './EditableIngredientRow'

interface IngredientsPanelProps {
    ingredients: Ingredient[]
    setIngredients: (ingredients: Ingredient[]) => void
    inventory: InventoryItem[]
    updateInventory: (ingredientId: string, newStock: number) => void
    addInventoryItem: (ingredientId: string, minimumStock: number) => void
}

export function IngredientsPanel({
    ingredients,
    setIngredients,
    inventory,
    updateInventory
}: IngredientsPanelProps) {
    const [error, setError] = useState<string | null>(null)
    const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null)
    const [showAddSection, setShowAddSection] = useState(false);
    const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'id'>>({
        name: '', price: 0, unit: '', amount: 1, minAmount: 0
    });

    // Add new ingredient
    const addIngredient = () => {
        setError(null)

        if (!newIngredient.name.trim()) {
            setError('El nombre del ingrediente es requerido')
            return
        }
        if (!newIngredient.unit.trim()) {
            setError('La unidad es requerida')
            return
        }
        if (newIngredient.price <= 0) {
            setError('El precio debe ser mayor a 0')
            return
        }
        if (newIngredient.amount <= 0) {
            setError('La cantidad debe ser mayor a 0')
            return
        }
        if (newIngredient.minAmount < 0) {
            setError('El stock mínimo no puede ser negativo')
            return
        }

        const ingredient: Ingredient = {
            ...newIngredient,
            id: Date.now().toString()
        }
        setIngredients([...ingredients, ingredient])
        setNewIngredient({ name: '', price: 0, unit: '', amount: 1, minAmount: 0 })
    }

    // Remove ingredient
    const removeIngredient = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este ingrediente?')) {
            setIngredients(ingredients.filter(ing => ing.id !== id))
        }
    }

    // Save edited ingredient
    const saveEditedIngredient = (updatedIngredient: Ingredient) => {
        setIngredients(ingredients.map(ing =>
            ing.id === updatedIngredient.id ? updatedIngredient : ing
        ))
        setEditingIngredientId(null)
    }

    // Conversion function
    const convertToReadableUnit = (amount: number, unit: string): string => {
        // For small amounts, convert to more appropriate units
        if (unit === 'kg' && amount < 1) {
            const converted = UnitConverter.convert({ value: amount, unit: 'kg' }, 'g');
            return converted ? `${converted.value.toFixed(0)}g` : `${amount} ${unit}`;
        }

        if ((unit === 'l' || unit === 'litro') && amount < 1) {
            const converted = UnitConverter.convert({ value: amount, unit: 'l' }, 'ml');
            return converted ? `${converted.value.toFixed(0)}ml` : `${amount} ${unit}`;
        }

        if (unit === 'docena' && amount < 1) {
            const converted = UnitConverter.convert({ value: amount, unit: 'docena' }, 'unidad');
            return converted ? `${converted.value.toFixed(0)} unidades` : `${amount} ${unit}`;
        }

        // Return original if no conversion needed or conversion fails
        return `${amount} ${unit}`;
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5" />
                    Ingredientes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <div className="flex justify-between items-center">
                            <span>{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-700 hover:text-red-900 font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Add New Ingredient */}
                <div className="mb-4">
                    <div
                        onClick={() => setShowAddSection(!showAddSection)}
                        className={`w-full bg-amber-600 hover:bg-amber-700 text-white text-base py-2 px-4 cursor-pointer flex items-center justify-center transition-all duration-300 ease-out relative ${showAddSection ? 'rounded-t-lg' : 'rounded-lg'
                            }`}
                    >
                        <div className="flex items-center">
                            {showAddSection ? 'Cancelar' : 'Agregar Ingrediente'}
                        </div>
                        <ChevronDown className={`h-6 w-6 absolute right-4 transition-transform duration-300 ease-out ${showAddSection ? '-rotate-180' : ''}`} />
                    </div>

                    {showAddSection && (
                        <div className="p-4 bg-amber-50 rounded-b-lg border border-amber-300 border-t-0 animate-in slide-in-from-top-1 duration-300 ease-out">
                            <h3 className="font-semibold text-lg text-amber-800 text-center">Agregar Ingrediente</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    maxLength={50}
                                    placeholder="Nombre del ingrediente"
                                    value={newIngredient.name}
                                    onChange={(e) => setNewIngredient({
                                        ...newIngredient, name: e.target.value.slice(0, 50)
                                    })}
                                    className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="Cantidad"
                                        value={newIngredient.amount === 1 ? '' : newIngredient.amount}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, amount: Math.max(0.01, Number(e.target.value) || 1) })}
                                        className="px-4 py-3 border-2 border-amber-300 rounded-lg text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    <select
                                        value={newIngredient.unit}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                        className="px-4 py-3 border-2 border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                                    >
                                        <option value="" className="text-base">Seleccionar unidad</option>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="lb">lb</option>
                                        <option value="oz">oz</option>
                                        <option value="l">l</option>
                                        <option value="ml">ml</option>
                                        <option value="cup">cup</option>
                                        <option value="tbsp">tbsp</option>
                                        <option value="tsp">tsp</option>
                                        <option value="unidad">unidad</option>
                                        <option value="docena">docena</option>
                                        <option value="paquete">paquete</option>
                                        <option value="sobre">sobre</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="Precio $"
                                        value={newIngredient.price === 0 ? '' : newIngredient.price}
                                        className="px-4 py-3 border-2 border-amber-300 rounded-lg text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        onChange={(e) => setNewIngredient({ ...newIngredient, price: Math.max(0.01, Number(e.target.value) || 0) })}
                                        onBlur={(e) => {
                                            const value = Number(e.target.value)
                                            if (value <= 0) setNewIngredient({ ...newIngredient, price: 0.01 })
                                        }}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        placeholder="Minimo"
                                        value={newIngredient.minAmount === 0 ? '' : newIngredient.minAmount}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, minAmount: Math.max(0, Number(e.target.value) || 0) })}
                                        className="px-4 py-3 border-2 border-amber-300 rounded-lg text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                            <Button onClick={addIngredient} className="w-full bg-amber-600 hover:bg-amber-700 text-base py-3 mt-2">
                                <Plus className="h-5 w-5 mr-2" />
                                Agregar Ingrediente
                            </Button>
                        </div>
                    )}
                </div>


                {/* Divider */}
                <div className="relative flex items-center my-6">
                    <div className="flex-grow border-t border-amber-300"></div>
                    <span className="mx-3 text-amber-600 text-lg font-medium">Lista de Ingredientes</span>
                    <div className="flex-grow border-t border-amber-300"></div>
                </div>

                {/* Ingredients List */}
                <div className="space-y-4 max-h-292 overflow-y-auto pr-2">
                    {ingredients.map((ingredient) => {
                        const inventoryItem = inventory.find(item => item.ingredientId === ingredient.id)
                        const currentStock = inventoryItem?.currentStock || 0

                        const isLowStock = currentStock <= ingredient.minAmount

                        return (
                            <div
                                key={ingredient.id}
                                className={`group relative border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg ${isLowStock
                                    ? 'bg-red-50 border-red-200 hover:border-red-400'
                                    : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                                    }`}
                            >
                                {editingIngredientId === ingredient.id ? (
                                    <EditableIngredientRow
                                        key='EditableIngredientRow'
                                        ingredient={ingredient}
                                        onSave={saveEditedIngredient}
                                        onCancel={() => setEditingIngredientId(null)}
                                    />
                                ) : (
                                    <>
                                        {/* Main Content */}
                                        <div className="flex items-start justify-between">
                                            {/* Ingredient Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                                    <div className="font-semibold text-gray-900 text-xl">{ingredient.name}</div>
                                                    <div className="text-sm text-amber-600 bg-amber-100 px-3 py-1 rounded-full font-medium">
                                                        {ingredient.unit}
                                                    </div>
                                                </div>

                                                {/* Pricing Information */}
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-md text-amber-700">Costo por unidad:</div>
                                                        <div className="text-md font-bold text-amber-800">
                                                            ${getIngredientCostPerUnit(ingredient).toFixed(2)} / {ingredient.unit}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Inventory Information */}
                                                <div className="mt-3 pt-3 border-t-2 border-gray-400 gap-4">                                                <div className="flex items-center justify-between text-md">
                                                    <span className="text-md text-gray-800">Stock actual:</span>

                                                    <div className="flex items-center bg-white border-2 border-amber-300 rounded-lg px-2 py-1 ml-4 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200 shadow-sm">

                                                        {/* Custom Decrement Button */}
                                                        <button
                                                            type="button"
                                                            className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-700 rounded-l-md border-r border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-colors duration-150 group"
                                                            onClick={() => {
                                                                const newValue = Math.max(0, (currentStock - 1) || 0);
                                                                updateInventory(ingredient.id, newValue);
                                                            }}
                                                        >
                                                            <svg className="w-4 h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                            </svg>
                                                        </button>

                                                        {/* Number Input */}
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={currentStock}
                                                            className="w-10 bg-transparent border-none text-center text-sm font-bold text-amber-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            onChange={(e) => {
                                                                const value = Math.max(0, Number(e.target.value) || 0)
                                                                updateInventory(ingredient.id, value)
                                                            }}
                                                        />

                                                        {/* Custom Increment Button */}
                                                        <button
                                                            type="button"
                                                            className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-700 rounded-r-md border-l border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-colors duration-150 group"
                                                            onClick={() => {
                                                                const newValue = (currentStock + 1) || 1;
                                                                updateInventory(ingredient.id, newValue);
                                                            }}
                                                        >
                                                            <svg className="w-4 h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </button>

                                                        <span className="text-md text-amber-700 font-semibold ml-2 whitespace-nowrap">
                                                            {ingredient.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                                    {isLowStock && inventoryItem && (
                                                        <div className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded mt-2">
                                                            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                                                                Stock bajo
                                                            </div>
                                                            <div className="flex items-center p-2 text-xs">
                                                                <span className="font-medium">Faltan:</span>
                                                                <span className="font-bold ml-1 text-red-700">
                                                                    {convertToReadableUnit(Number((ingredient.minAmount - currentStock).toFixed(2)), ingredient.unit)}
                                                                </span>
                                                                {/* <span className="font-medium">Actual:</span>
                                                                <span className="font-bold">{currentStock.toFixed(2)} {ingredient.unit}</span>
                                                                <span className="text-red-600 mx-1">•</span>
                                                                <span className="font-medium">Mínimo:</span>
                                                                <span className="font-bold">{ingredient.minAmount} {ingredient.unit}</span> */}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons - Always visible on mobile */}
                                            <div className="flex items-center gap-1 flex-shrink-0 ml-4 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                                <button
                                                    onClick={() => setEditingIngredientId(ingredient.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                    title="Editar ingrediente"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => removeIngredient(ingredient.id)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                    title="Eliminar ingrediente"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}

                    {/* Empty State */}
                    {ingredients.length === 0 && (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-xl">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calculator className="h-10 w-10 text-gray-400" />
                            </div>
                            <div className="text-gray-500 text-lg mb-2">No hay ingredientes registrados</div>
                            <div className="text-gray-400 text-sm">Agrega tu primer ingrediente usando el formulario de arriba</div>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardContent>
                {/* Mobile Quick Actions */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4">
                    <h4 className="font-semibold text-green-800 text-center text-xl mb-3">Resumen</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white border border-green-500 rounded-lg p-3">
                            <div className="text-sm text-gray-600">Costo Total</div>
                            <div className="text-lg font-bold text-green-700">
                                ${ingredients.reduce((total, ing) => total + ing.price, 0).toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-white border border-green-500 rounded-lg p-3">
                            <div className="text-sm text-gray-600">Ingredientes</div>
                            <div className="text-lg font-bold text-green-700">{ingredients.length}</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >
    )
}