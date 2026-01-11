"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { Ingredient } from '@/lib/types'
import { CustomNumberInput } from './CustomNumberInput';
import { CustomSelect } from './CustomSelect'
import { DEFAULT_UNIT_CONVERSIONS } from '@/lib/unit-conversion'

interface EditableIngredientRowProps {
    ingredient: Ingredient
    onSave: (ingredient: Ingredient) => void
    onCancel: () => void
}

export function EditableIngredientRow({ ingredient, onSave, onCancel }: EditableIngredientRowProps) {
    const [localIngredient, setLocalIngredient] = useState(ingredient);
    const [specialUnit, setSpecialUnit] = useState({
        containsAmount: ingredient.containsAmount || 0,
        containsUnit: ingredient.containsUnit || 'g'
    });

    const units = [
        { value: '', label: 'Selecciona...', fullName: '' },
        { value: 'kg', label: 'kg', fullName: 'kilogramo' },
        { value: 'g', label: 'g', fullName: 'gramo' },
        { value: 'lb', label: 'lb', fullName: 'libra' },
        { value: 'oz', label: 'oz', fullName: 'onza' },
        { value: 'l', label: 'l', fullName: 'litro' },
        { value: 'ml', label: 'ml', fullName: 'mililitro' },
        { value: 'cup', label: 'cup', fullName: 'taza' },
        { value: 'tbsp', label: 'tbsp', fullName: 'cucharada' },
        { value: 'tsp', label: 'tsp', fullName: 'cucharadita' },
        { value: 'unidad', label: 'unidad', fullName: '' },
        { value: 'docena', label: 'docena', fullName: '' },
        { value: 'paquete', label: 'paquete', fullName: '' },
        { value: 'sobre', label: 'sobre', fullName: '' },
        { value: 'latas', label: 'latas', fullName: '' },
        { value: 'botella', label: 'botella', fullName: '' },
        { value: 'bolsa', label: 'bolsa', fullName: '' },
    ]

    const handleSave = () => {
        // Include special unit data for non-standard units
        const ingredientToSave = {
            ...localIngredient,
            minAmountUnit: localIngredient.minAmountUnit || localIngredient.unit,
            ...(['botella', 'bolsa', 'docena', 'paquete', 'sobre', 'caja', 'latas'].includes(localIngredient.unit) && {
                containsAmount: specialUnit.containsAmount,
                containsUnit: specialUnit.containsUnit
            })
        };


        onSave(ingredientToSave);
    };

    return (
        <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start">
                {/* Amount Field */}
                <div className="relative z-[99999]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <CustomNumberInput
                        value={localIngredient.amount ?? ''}
                        onChange={(value) => setLocalIngredient({ ...localIngredient, amount: value })}
                        className="w-full h-[42px] sm:h-[52px]"
                        min={0}
                        max={10000}
                        placeholder="Cantidad"
                        color='gray'
                    />
                </div>

                {/* Price Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                    <CustomNumberInput
                        value={localIngredient.price ?? ''}
                        onChange={(value) => setLocalIngredient({ ...localIngredient, price: value })}
                        className="w-full h-[42px] sm:h-[52px]"
                        min={0}
                        max={10000}
                        placeholder="Precio ($)"
                        color='gray'
                    />
                </div>

                {/* Unit Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                    <CustomSelect
                        value={localIngredient.unit}
                        onChange={(value) => {
                            setLocalIngredient(prev => ({ ...prev, unit: value }));

                            // Set default values for special units
                            if (DEFAULT_UNIT_CONVERSIONS[value]) {
                                setSpecialUnit({
                                    containsAmount: DEFAULT_UNIT_CONVERSIONS[value].amount,
                                    containsUnit: DEFAULT_UNIT_CONVERSIONS[value].unit
                                });
                            } else {
                                setSpecialUnit({ containsUnit: 'g', containsAmount: 0 });
                            }
                        }}
                        options={units}
                        placeholder="Selecciona..."
                        color="gray"
                        className="w-full"
                        showFullName={true}
                    />
                </div>

                {/* Minimum Stock Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                    <CustomNumberInput
                        value={localIngredient.minAmount || 0}
                        onChange={(value) => setLocalIngredient({ ...localIngredient, minAmount: value })}
                        className="w-full h-[42px] sm:h-[52px]"
                        min={0}
                        max={10000}
                        placeholder="Stock mínimo"
                        color='gray'
                    />
                </div>

                {/* Minimum Unit Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad del stock mínimo</label>
                    <CustomSelect
                        value={localIngredient.minAmountUnit || localIngredient.unit}
                        onChange={(value) => setLocalIngredient(prev => ({
                            ...prev,
                            minAmountUnit: value
                        }))}
                        options={units}
                        placeholder="Selecciona..."
                        color="gray"
                        className="w-full"
                        showFullName={true}
                    />
                </div>


                {/* Package Content for non-standard units */}
                {['botella', 'bolsa', 'docena', 'paquete', 'sobre', 'caja', 'latas'].includes(localIngredient.unit) && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contiene cantidad
                            </label>
                            <CustomNumberInput
                                value={specialUnit.containsAmount}
                                onChange={(value) => setSpecialUnit({ ...specialUnit, containsAmount: value })}
                                className="w-full h-[42px] sm:h-[52px]"
                                min={0}
                                max={10000}
                                placeholder="250"
                                allowDecimals={true}
                                color='gray'
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unidad de contenido
                            </label>
                            <CustomSelect
                                value={specialUnit.containsUnit}
                                onChange={(value) => setSpecialUnit({ ...specialUnit, containsUnit: value })}
                                options={units}
                                placeholder="Selecciona..."
                                color="gray"
                                className="w-full"
                                showFullName={true}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                </Button>
                <Button
                    onClick={onCancel}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                >
                    Cancelar
                </Button>
            </div>
        </div>
    )
}