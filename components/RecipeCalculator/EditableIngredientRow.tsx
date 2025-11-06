"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { Ingredient } from '@/lib/types'

interface EditableIngredientRowProps {
    ingredient: Ingredient
    onSave: (ingredient: Ingredient) => void
    onCancel: () => void
}

export function EditableIngredientRow({ ingredient, onSave, onCancel }: EditableIngredientRowProps) {
    const [localIngredient, setLocalIngredient] = useState(ingredient)

    const handleSave = () => {
        onSave(localIngredient)
    }

    return (
        <div className="flex-1 min-w-0 space-y-4">
            {/* Name Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                    type="text"
                    value={localIngredient.name}
                    onChange={(e) => setLocalIngredient(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del ingrediente"
                    autoFocus
                />
            </div>

            {/* Grid for other fields */}
            <div className="grid grid-cols-2 gap-4">

                {/* Amount Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad  </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={localIngredient.amount}
                        onChange={(e) => setLocalIngredient(prev => ({ ...prev, amount: Number(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1.00"
                    />
                </div>

                {/* Price Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localIngredient.price}
                        onChange={(e) => setLocalIngredient(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                    />
                </div>

                {/* Unit Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                    <select
                        value={localIngredient.unit}
                        onChange={(e) => setLocalIngredient(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                        <option value="" className="text-gray-500">Seleccionar unidad</option>
                        <option value="kg" className="text-gray-900">kg</option>
                        <option value="g" className="text-gray-900">g</option>
                        <option value="lb" className="text-gray-900">lb</option>
                        <option value="oz" className="text-gray-900">oz</option>
                        <option value="l" className="text-gray-900">l</option>
                        <option value="ml" className="text-gray-900">ml</option>
                        <option value="cup" className="text-gray-900">cup</option>
                        <option value="tbsp" className="text-gray-900">tbsp</option>
                        <option value="tsp" className="text-gray-900">tsp</option>
                        <option value="unidad" className="text-gray-900">unidad</option>
                        <option value="docena" className="text-gray-900">docena</option>
                        <option value="paquete" className="text-gray-900">paquete</option>
                        <option value="sobre" className="text-gray-900">sobre</option>
                    </select>
                </div>





                {/* Minimum Stock Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localIngredient.minAmount}
                        onChange={(e) => setLocalIngredient(prev => ({ ...prev, minAmount: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                </Button>
                <Button
                    onClick={onCancel}
                    variant="outline"
                    size="sm"
                >
                    Cancelar
                </Button>
            </div>
        </div>
    )
}