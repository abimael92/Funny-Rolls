"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Info } from "lucide-react"
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
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const toggleTooltip = (fieldName: string) => {
        setActiveTooltip(activeTooltip === fieldName ? null : fieldName);
    };

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
        <div className="flex-1 min-w-0 space-y-4">
            {/* Name Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del ingrediente *
                </label>
                <input
                    type="text"
                    maxLength={50}
                    placeholder="Harina de trigo"
                    value={localIngredient.name}
                    onChange={(e) => setLocalIngredient(prev => ({ ...prev, name: e.target.value.slice(0, 50) }))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                />
            </div>

            {/* Amount and Unit Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad *
                    </label>
                    <CustomNumberInput
                        value={localIngredient.amount || 0}
                        onChange={(value) => setLocalIngredient({ ...localIngredient, amount: value })}
                        className="w-full border-2 border-gray-300 rounded-lg text-base sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={0}
                        max={10000}
                        placeholder="100"
                        allowDecimals={true}
                        color="gray"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad *
                    </label>
                    <CustomSelect
                        value={localIngredient.unit}
                        onChange={(value) => {
                            setLocalIngredient(prev => ({ ...prev, unit: value }));

                            // Set default values immediately
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
                        color="gray"
                    />
                </div>
            </div>

            {/* Package Content - Show only for non-standard units */}
            {['botella', 'bolsa', 'docena', 'paquete', 'sobre', 'caja', 'latas'].includes(localIngredient.unit) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contiene cantidad
                            <span className="ml-1 relative inline-block align-middle">
                                <Info
                                    className="h-4 w-4 inline text-gray-600 cursor-help tooltip-icon"
                                    onClick={() => toggleTooltip('contains-amount')}
                                />
                                {activeTooltip === 'contains-amount' && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-normal max-w-xs">
                                        {`Unidades contenidas dentro del contenedor.`}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                )}
                            </span>
                        </label>
                        <CustomNumberInput
                            value={specialUnit.containsAmount}
                            onChange={(value) => setSpecialUnit({ ...specialUnit, containsAmount: value })}
                            className="w-full border-2 border-gray-300 rounded-lg"
                            min={0}
                            max={10000}
                            placeholder="250"
                            allowDecimals={true}
                            color="gray"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unidad/Contenido
                            <span className="ml-1 relative inline-block align-middle">
                                <Info
                                    className="h-4 w-4 inline text-gray-600 cursor-help tooltip-icon"
                                    onClick={() => toggleTooltip('contains-unit')}
                                />
                                {activeTooltip === 'contains-unit' && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-normal max-w-xs">
                                        {`La unidad de medida dentro del contenedor.`}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                )}
                            </span>
                        </label>
                        <CustomSelect
                            value={specialUnit.containsUnit}
                            onChange={(value) => setSpecialUnit({ ...specialUnit, containsUnit: value })}
                            options={units.filter(u => !['botella', 'bolsa', 'docena', 'paquete', 'sobre', 'caja', 'latas', ''].includes(u.value))}
                            color="gray"
                        />
                    </div>
                </div>
            )}

            {/* Price */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio *
                </label>
                <CustomNumberInput
                    value={localIngredient.price}
                    onChange={(value) => setLocalIngredient({ ...localIngredient, price: Math.max(1, value || 0) })}
                    allowDecimals={false}
                    className="w-full border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={0}
                    max={10000}
                    placeholder="20"
                    color="gray"
                />
            </div>

            {/* Minimum Amount and Unit Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad mínima
                    </label>
                    <CustomNumberInput
                        value={localIngredient.minAmount || 0}
                        onChange={(value) => setLocalIngredient({ ...localIngredient, minAmount: value })}
                        className="w-full border-2 border-gray-300 rounded-lg"
                        min={0}
                        max={10000}
                        placeholder="0"
                        allowDecimals={true}
                        color="gray"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad mínima
                    </label>
                    <CustomSelect
                        value={localIngredient.minAmountUnit || localIngredient.unit}
                        onChange={(value) => setLocalIngredient(prev => ({
                            ...prev,
                            minAmountUnit: value
                        }))}
                        options={units}
                        color="gray"
                    />
                </div>
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