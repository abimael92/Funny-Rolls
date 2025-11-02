"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp } from "lucide-react"
import { Ingredient, Recipe, ProductionRecord, InventoryItem } from '@/lib/types'

interface ProductionTrackerPanelProps {
    productionHistory: ProductionRecord[]
    inventory: InventoryItem[]
    ingredients: Ingredient[]
    recipes: Recipe[]
    updateInventory: (ingredientId: string, newStock: number) => void
}

export function ProductionTrackerPanel({
    productionHistory,
    inventory,
    ingredients,
    updateInventory
}: ProductionTrackerPanelProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // DEBUG
    // console.log('ingredients data: ', ingredients);
    // console.log('inventory data: ', inventory);

    // Calculate total production stats
    const totalBatches = productionHistory.reduce((sum, record) => sum + record.batchCount, 0)
    const totalProduced = productionHistory.reduce((sum, record) => sum + record.totalProduced, 0)

    // Filter production history by date
    const todayProduction = productionHistory.filter(record =>
        record.date.startsWith(selectedDate)
    )

    // Get low stock items
    const lowStockItems = inventory.filter(item => {
        const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
        return ingredient && item.currentStock <= ingredient.minAmount
    });

    console.log(" LOW STOCK ITEMS:", lowStockItems)

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">Seguimiento de Producción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Production Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">{totalBatches}</div>
                        <div className="text-sm text-blue-600">Lotes Totales</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{totalProduced}</div>
                        <div className="text-sm text-green-600">Unidades Producidas</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-amber-700">{productionHistory.length}</div>
                        <div className="text-sm text-amber-600">Días de Producción</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{lowStockItems.length}</div>
                        <div className="text-sm text-red-600">Stock Bajo</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Production History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Historial de Producción
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Filtrar por fecha:
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {todayProduction.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No hay producción registrada para esta fecha
                                    </div>
                                ) : (
                                    todayProduction.map(record => (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                        >
                                            <div>
                                                <div className="font-semibold">{record.recipeName}</div>
                                                <div className="text-sm text-gray-600">
                                                    {record.batchCount} lote(s) - {record.totalProduced} unidades
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(record.date).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Gestión de Inventario
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {inventory.map(item => {
                                    const ingredient = ingredients.find(ing => ing.id === item.ingredientId)
                                    if (!ingredient) return null

                                    const isLowStock = item.currentStock <= ingredient.minAmount

                                    return (
                                        <div
                                            key={item.ingredientId}
                                            className={`p-3 rounded-lg border-2 ${isLowStock
                                                ? 'bg-red-50 border-red-300'
                                                : 'bg-green-50 border-green-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-semibold">{ingredient.name}</div>
                                                {isLowStock && (
                                                    <div className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                                                        Stock Bajo
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-800">
                                                    Stock actual: {item.currentStock.toFixed(2)} {item.unit}
                                                </div>
                                                <div className="flex items-center gap-2 bg-white border-2 border-amber-300 rounded-lg ml-4 px-3 py-2 min-w-[140px] hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.currentStock}
                                                        onChange={(e) => updateInventory(item.ingredientId, Number(e.target.value) || 0)}
                                                        className="w-20 bg-transparent border-none text-md font-bold text-amber-900 focus:outline-none focus:ring-0"
                                                    />
                                                    <span className="text-md text-amber-700 font-semibold">{item.unit}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-red-800  font-medium px-3 py-2 rounded-lg mt-1">
                                                Mínimo: {ingredient.minAmount} {item.unit}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Production */}
                <Card>
                    <CardHeader>
                        <CardTitle>Producción Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {productionHistory.slice(0, 10).map(record => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                >
                                    <div className="flex-1">
                                        <div className="font-semibold">{record.recipeName}</div>
                                        <div className="text-sm text-gray-600">
                                            {record.batchCount} lote(s) × {record.totalProduced / record.batchCount} unidades
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-green-600">
                                            {record.totalProduced} unidades
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(record.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {productionHistory.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No hay historial de producción
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    )
}