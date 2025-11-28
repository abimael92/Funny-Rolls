"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftRight, Calculator, ChevronDown, CookingPot, Info, Save, Trash2, Edit, UtensilsCrossed, Utensils, Wrench } from "lucide-react"
import { Ingredient, InventoryItem } from '@/lib/types'
import { getIngredientCostPerUnit } from '@/lib/utils'
import { DEFAULT_UNIT_CONVERSIONS } from '@/lib/unit-conversion'
import { UnitConverter } from '@/lib/unit-conversion';
import { EditableIngredientRow } from './EditableIngredientRow'
import { CustomNumberInput } from './CustomNumberInput';
import { CustomSelect } from './CustomSelect';
import { ToolsPanel } from './ToolsPanel';
import { CloseButton, ActionButton } from './ModalHelpers';
import { Tool } from '@/lib/types';
import { defaultTools, } from '@/lib/data';

// List,
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
        name: '', price: 0, unit: '', amount: 0, minAmount: 0
    });
    const [showTotalCostModal, setShowTotalCostModal] = useState(false);
    const [tools, setTools] = useState<Tool[]>(defaultTools);
    const [showTools, setShowTools] = useState(false);
    const [showIngredientsModal, setShowIngredientsModal] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [specialUnit, setSpecialUnit] = useState({
        containsAmount: 0,
        containsUnit: 'g'
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

        // For non-standard units, use the package content for calculations
        if (['paquete', 'sobre', 'caja', 'lata'].includes(newIngredient.unit)) {
            if (specialUnit.containsAmount <= 0) {
                setError('La cantidad total del paquete debe ser mayor a 0')
                return
            }
        }

        const ingredient: Ingredient = {
            ...newIngredient,
            id: Date.now().toString()
        }
        setIngredients([...ingredients, ingredient])
        setNewIngredient({ name: '', price: 0, unit: '', amount: 0, minAmount: 0 })
        setSpecialUnit({ containsUnit: 'g', containsAmount: 0 })
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

    const toggleTooltip = (fieldName: string) => {
        setActiveTooltip(activeTooltip === fieldName ? null : fieldName);
    };

    return (
        <Card className="w-full">

            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {showTools ? (
                            <CookingPot className="h-5 w-5" />
                        ) : (
                            <UtensilsCrossed className="h-5 w-5" />
                        )}
                        {showTools ? 'Herramientas' : 'Ingredientes'}
                    </CardTitle>


                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTools(!showTools)}
                        className="flex items-center gap-2"
                    >
                        {showTools ? (
                            <>
                                <Utensils className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                <Wrench className="h-4 w-4" />
                            </>
                        )}

                        <ArrowLeftRight
                            className={`h-4 w-4 transition-transform duration-300 ${showTools ? 'rotate-180' : 'rotate-0'
                                }`}
                        />
                    </Button>


                </div>
            </CardHeader>

            <CardContent className="space-y-4">

                {showTools ? (
                    <ToolsPanel tools={tools} setTools={setTools} />
                ) : (

                    <>
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
                                className={`w-full bg-amber-600 hover:bg-amber-700 text-white text-base py-2 px-4 cursor-pointer flex items-center justify-center transition-all duration-300 ease-out relative ${showAddSection ? 'rounded-t-lg' : 'rounded-lg'}`}
                            >
                                <div className="flex items-center">
                                    {showAddSection ? 'Cancelar' : 'Agregar Ingrediente'}
                                </div>
                                <ChevronDown className={`h-6 w-6 absolute right-4 transition-transform duration-300 ease-out ${showAddSection ? '-rotate-180' : ''}`} />
                            </div>

                            {/* Remove overflow-hidden and use conditional rendering instead */}
                            {showAddSection && (
                                <div className="p-4 bg-amber-50 rounded-b-lg border border-amber-300 border-t-0">
                                    <h3 className="font-semibold text-lg text-amber-800 text-center mb-4">Agregar Ingrediente</h3>
                                    <div className="space-y-4">
                                        {/* Name Input */}
                                        <div>
                                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                                Nombre del ingrediente *
                                                <span className="ml-1 relative inline-block align-middle">
                                                    <Info
                                                        className="h-4 w-4 inline text-amber-600 cursor-help tooltip-icon"
                                                        onClick={() => toggleTooltip('ingredient-name')}
                                                    />
                                                    {activeTooltip === 'ingredient-name' && (
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-nowrap">
                                                            {`Nombre del ingrediente`}
                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    )}
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={50}
                                                placeholder="Harina de trigo"
                                                value={newIngredient.name}
                                                onChange={(e) => setNewIngredient({
                                                    ...newIngredient, name: e.target.value.slice(0, 50)
                                                })}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-amber-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            />
                                        </div>

                                        {/* Amount and Unit Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                                    Cantidad *
                                                    <span className="ml-1 relative inline-block align-middle">
                                                        <Info
                                                            className="h-4 w-4 inline text-amber-600 cursor-help tooltip-icon"
                                                            onClick={() => toggleTooltip('ingredient-amount')}
                                                        />
                                                        {activeTooltip === 'ingredient-amount' && (
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-nowrap">
                                                                {`Cantidad del ingrediente`}
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        )}
                                                    </span>
                                                </label>
                                                <CustomNumberInput
                                                    value={newIngredient.amount || 0}
                                                    onChange={(value) => setNewIngredient({ ...newIngredient, amount: value })}
                                                    className="w-full border-2 border-amber-300 rounded-lg text-base sm:text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                    min={0}
                                                    max={10000}
                                                    placeholder="100"
                                                    allowDecimals={true}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                                    Unidad *
                                                    <span className="ml-1 relative inline-block align-middle">
                                                        <Info
                                                            className="h-4 w-4 inline text-amber-600 cursor-help tooltip-icon"
                                                            onClick={() => toggleTooltip('ingredient-unit')}
                                                        />
                                                        {activeTooltip === 'ingredient-unit' && (
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-nowrap">
                                                                {`Unidad de medida del ingrediente`}
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        )}
                                                    </span>
                                                </label>
                                                <CustomSelect
                                                    value={newIngredient.unit}
                                                    onChange={(value) => {
                                                        setNewIngredient({ ...newIngredient, unit: value });

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
                                                />
                                            </div>
                                        </div>

                                        {/* Package Content - Show only for non-standard units */}
                                        {['botella', 'bolsa', 'docena', 'paquete', 'sobre', 'caja', 'latas'].includes(newIngredient.unit) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-amber-700 mb-2">
                                                        Contiene cantidad
                                                    </label>
                                                    <CustomNumberInput
                                                        value={specialUnit.containsAmount}
                                                        onChange={(value) => setSpecialUnit({ ...specialUnit, containsAmount: value })}
                                                        className="w-full border-2 border-amber-300 rounded-lg"
                                                        min={0}
                                                        max={10000}
                                                        placeholder="250"
                                                        allowDecimals={true}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-amber-700 mb-2">
                                                        Unidad de contenido
                                                    </label>
                                                    <CustomSelect
                                                        value={specialUnit.containsUnit}
                                                        onChange={(value) => setSpecialUnit({ ...specialUnit, containsUnit: value })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Price and Min Amount Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                                    Precio *
                                                    <span className="ml-1 relative inline-block align-middle">
                                                        <Info
                                                            className="h-4 w-4 inline text-amber-600 cursor-help tooltip-icon"
                                                            onClick={() => toggleTooltip('ingredient-price')}
                                                        />
                                                        {activeTooltip === 'ingredient-price' && (
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-nowrap">
                                                                {`Precio total del ingrediente`}
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        )}
                                                    </span>
                                                </label>
                                                <CustomNumberInput
                                                    value={newIngredient.price}
                                                    onChange={(value) => setNewIngredient({ ...newIngredient, price: Math.max(1, value || 0) })}
                                                    allowDecimals={false}
                                                    className="w-full border-2 border-amber-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                    min={0}
                                                    max={10000}
                                                    placeholder="20"
                                                />

                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                                    Stock Mínimo *
                                                    <span className="ml-1 relative inline-block align-middle">
                                                        <Info
                                                            className="h-4 w-4 inline text-amber-600 cursor-help tooltip-icon"
                                                            onClick={() => toggleTooltip('ingredient-minAmount')}
                                                        />
                                                        {activeTooltip === 'ingredient-minAmount' && (
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-nowrap">
                                                                {`Cantidad mínima para un lote`}
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        )}
                                                    </span>
                                                </label>
                                                <CustomNumberInput
                                                    value={newIngredient.minAmount || 0}
                                                    onChange={(value) => setNewIngredient({ ...newIngredient, minAmount: value })}
                                                    className="w-full border-2 border-amber-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                    min={0}
                                                    max={10000}
                                                    placeholder="0.10"
                                                    allowDecimals={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={addIngredient} className="w-full bg-amber-600 hover:bg-amber-700 text-sm sm:text-base py-2 sm:py-3 mt-4">
                                        <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        Guardar
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center my-6">
                            <div className="flex-grow border-t border-amber-300"></div>
                            <span className="mx-3 text-amber-600 text-base sm:text-lg font-medium">Lista de Ingredientes</span>
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
                                        className={`group relative border-2 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-lg ${isLowStock
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
                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">

                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-semibold text-gray-900 text-lg sm:text-xl truncate">{ingredient.name}</div>
                                                                    <div className="text-xs sm:text-sm text-amber-600 bg-amber-100 px-2 sm:px-3 py-1 rounded-full font-medium">
                                                                        {ingredient.unit}
                                                                    </div>
                                                                </div>

                                                            </div>

                                                            {/* Action Buttons - Always visible on mobile */}
                                                            <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                                                <button
                                                                    onClick={() => setEditingIngredientId(ingredient.id)}
                                                                    className="p-1 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                                    title="Editar ingrediente"
                                                                >
                                                                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeIngredient(ingredient.id)}
                                                                    className="p-1 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                                    title="Eliminar ingrediente"
                                                                >
                                                                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Pricing Information */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-sm sm:text-md text-amber-700">Costo por unidad:</div>
                                                                <div className="text-sm sm:text-md font-bold text-amber-800">
                                                                    ${getIngredientCostPerUnit(ingredient).toFixed(2)} / {ingredient.unit}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Inventory Information */}
                                                        <div className="mt-3 pt-3 border-t-2 border-gray-400 gap-4">                                                <div className="flex items-center justify-between text-sm sm:text-md">
                                                            <span className="text-sm sm:text-md text-gray-800">Stock actual:</span>

                                                            <div className="flex items-center bg-white border-2 border-amber-300 rounded-lg px-1 sm:px-2 py-1 ml-2 sm:ml-4 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200 shadow-sm">

                                                                {/* Custom Decrement Button */}
                                                                <button
                                                                    type="button"
                                                                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center bg-amber-50 text-amber-700 rounded-l-md border-r border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-colors duration-150 group"
                                                                    onClick={() => {
                                                                        const newValue = Math.max(0, (currentStock - 1) || 0);
                                                                        updateInventory(ingredient.id, newValue);
                                                                    }}
                                                                >
                                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                                    </svg>
                                                                </button>

                                                                {/* Number Input */}
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={currentStock}
                                                                    className="w-8 sm:w-10 bg-transparent border-none text-center text-xs sm:text-sm font-bold text-amber-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    onChange={(e) => {
                                                                        const value = Math.max(0, Number(e.target.value) || 0)
                                                                        updateInventory(ingredient.id, value)
                                                                    }}
                                                                />

                                                                {/* Custom Increment Button */}
                                                                <button
                                                                    type="button"
                                                                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center bg-amber-50 text-amber-700 rounded-r-md border-l border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-colors duration-150 group"
                                                                    onClick={() => {
                                                                        const newValue = (currentStock + 1) || 1;
                                                                        updateInventory(ingredient.id, newValue);
                                                                    }}
                                                                >
                                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                </button>

                                                                <span className="text-sm sm:text-md text-amber-700 font-semibold ml-1 sm:ml-2 whitespace-nowrap">
                                                                    {ingredient.unit}
                                                                </span>
                                                            </div>
                                                        </div>
                                                            {isLowStock && inventoryItem && (
                                                                <div className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded mt-2">
                                                                    <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm mb-1">
                                                                        Stock bajo
                                                                    </div>
                                                                    <div className="flex items-center p-1 sm:p-2 text-xs">
                                                                        <span className="font-medium">Faltan:</span>
                                                                        <span className="font-bold ml-1 text-red-700">
                                                                            {UnitConverter.convertToReadableUnit(Number((ingredient.minAmount - currentStock).toFixed(2)), ingredient.unit)}
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


                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Empty State */}
                            {ingredients.length === 0 && (
                                <div className="text-center py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-xl">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <Calculator className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                                    </div>
                                    <div className="text-gray-500 text-base sm:text-lg mb-2">No hay ingredientes registrados</div>
                                    <div className="text-gray-400 text-xs sm:text-sm">Agrega tu primer ingrediente usando el formulario de arriba</div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>

            {!showTools && (
                <CardContent>
                    {/* Mobile Quick Actions */}
                    <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-300 rounded-2xl p-3 sm:p-4">
                        <h4 className="font-semibold text-blue-800 text-center text-lg sm:text-xl mb-2 sm:mb-3">Resumen</h4>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                            <div
                                className="bg-white border border-red-500 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-red-50 transition-colors"
                                onClick={() => setShowTotalCostModal(true)}
                            >
                                <div className="text-xs sm:text-sm text-gray-600">Costo Total</div>
                                <div className="text-base sm:text-lg font-bold text-red-700">
                                    ${ingredients.reduce((total, ing) => total + ing.price, 0)
                                        .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                    }
                                </div>
                            </div>
                            <div
                                className="bg-white border border-green-500 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-green-50 transition-colors"
                                onClick={() => setShowIngredientsModal(true)}
                            >
                                <div className="text-xs sm:text-sm text-gray-600">Ingredientes</div>
                                <div className="text-base sm:text-lg font-bold text-green-700">{ingredients.length}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}

            {/* Total Cost Breakdown Modal */}
            {showTotalCostModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold text-red-800">Costo Total de Ingredientes</h3>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-64">
                            {ingredients.map((ingredient) => (
                                <div key={ingredient.id} className="flex justify-between items-center py-2 border-b">
                                    <div className="flex-1">
                                        <div className="font-medium">{ingredient.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {ingredient.amount} {ingredient.unit}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-700">${ingredient.price.toFixed(2)}</div>
                                        <div className="text-sm text-gray-500">
                                            ${getIngredientCostPerUnit(ingredient).toFixed(2)}/{ingredient.unit}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t bg-gray-50">
                            <div className="flex justify-between items-center font-bold text-lg mb-2">
                                <span>Total:</span>
                                <span className="text-red-700">
                                    ${ingredients.reduce((total, ing) => total + ing.price, 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                                {ingredients.length} ingrediente{ingredients.length !== 1 ? 's' : ''}
                            </div>
                            <button
                                onClick={() => setShowTotalCostModal(false)}
                                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ingredients Count Modal */}
            {showIngredientsModal && (

                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowIngredientsModal(false)}
                        />
                        <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">

                            {/* Header */}
                            <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">📋</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-800">Todos los Ingredientes</h3>
                                            <p className="text-sm text-green-600">Inventario completo ({ingredients.length} ingredientes)</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowIngredientsModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-96">
                                <div className="space-y-3">
                                    {ingredients.map((ingredient) => {
                                        const inventoryItem = inventory.find(item => item.ingredientId === ingredient.id);
                                        const currentStock = inventoryItem?.currentStock || 0;
                                        const isLowStock = currentStock <= ingredient.minAmount;

                                        return (
                                            <div key={ingredient.id} className={`flex justify-between items-center p-3 rounded-lg ${isLowStock ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900">{ingredient.name}</div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        ${getIngredientCostPerUnit(ingredient).toFixed(2)}/{ingredient.unit}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Stock: {currentStock} {ingredient.unit}
                                                        {isLowStock && (
                                                            <span className="text-red-600 font-semibold ml-2">• Stock bajo</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-green-700">
                                                        ${ingredient.price.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Total
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-gray-50">

                                <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-lg border">
                                    <span className="font-bold text-gray-900">Valor Total Inventario:</span>
                                    <span className="text-xl font-bold text-green-700">
                                        ${ingredients.reduce((total, ing) => total + ing.price, 0).toFixed(2)}
                                    </span>
                                </div>

                                <ActionButton
                                    onClick={() => setShowIngredientsModal(false)}
                                    color="green"
                                    fullWidth
                                >
                                    Cerrar
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                </>

            )}
        </Card>
    )
}