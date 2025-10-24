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
        <div className="flex-1 min-w-0 space-y-2">
            <input
                type="text"
                value={localIngredient.name}
                onChange={(e) => setLocalIngredient(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm bg-white"
                placeholder="Nombre"
                autoFocus
            />
            <div className="grid grid-cols-3 gap-2">
                <input
                    type="text"
                    value={localIngredient.unit}
                    onChange={(e) => setLocalIngredient(prev => ({ ...prev, unit: e.target.value }))}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="Unidad"
                />
                <input
                    type="number"
                    step="0.01"
                    value={localIngredient.price}
                    onChange={(e) => setLocalIngredient(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="Precio"
                />
                <input
                    type="number"
                    step="0.01"
                    value={localIngredient.amount}
                    onChange={(e) => setLocalIngredient(prev => ({ ...prev, amount: Number(e.target.value) || 1 }))}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="Cantidad"
                />
            </div>
            <div className="flex gap-2 mt-2">
                <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs py-1 h-7"
                >
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                </Button>
                <Button
                    onClick={onCancel}
                    variant="outline"
                    size="sm"
                    className="text-xs py-1 h-7"
                >
                    Cancelar
                </Button>
            </div>
        </div>
    )
}