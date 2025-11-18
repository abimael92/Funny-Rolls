"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { Ingredient, Recipe, ProductionRecord, InventoryItem } from '@/lib/types'
import { UnitConverter } from '../../lib/unit-conversion';

interface ProductionTrackerPanelProps {
    productionHistory: ProductionRecord[]
    inventory: InventoryItem[]
    ingredients: Ingredient[]
    recipes: Recipe[]
    updateInventory: (ingredientId: string, newStock: number) => void
    updateProductionStatus?: (recordId: string, itemId: string, status: ProductionStatus) => void
    addProductionItem?: (recordId: string, item: ProductionItem) => void
}

interface ProductionItem {
    id: string
    status: ProductionStatus
    quantity: number
}

type ProductionStatus = 'good' | 'sold' | 'bad' | 'burned' | 'damaged'

export function ProductionTrackerPanel({
    productionHistory,
    inventory,
    ingredients,
    recipes,
    updateInventory,
    updateProductionStatus
}: ProductionTrackerPanelProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
    const [currentProductionItems, setCurrentProductionItems] = useState<{ [recordId: string]: ProductionItem[] }>({})

    // Toggle accordion
    const toggleRecord = (recordId: string) => {
        const newExpanded = new Set(expandedRecords);
        if (newExpanded.has(recordId)) {
            newExpanded.delete(recordId);
        } else {
            newExpanded.add(recordId);
        }
        setExpandedRecords(newExpanded);
    };

    // Update the status change handler for individual items
    const handleItemStatusChange = (recordId: string, itemId: string, status: ProductionStatus) => {
        // Update local state
        setCurrentProductionItems(prev => ({
            ...prev,
            [recordId]: (prev[recordId] || []).map(item =>
                item.id === itemId ? { ...item, status } : item
            )
        }));

        // Call the prop function if provided
        if (updateProductionStatus) {
            updateProductionStatus(recordId, itemId, status);
        }
    }

    // Add function to handle new item creation
    const handleAddProductionItem = (recordId: string, quantity: number = 1, autoIndex?: number) => {
        const newItem: ProductionItem = {
            id: `item-${recordId}-${Date.now()}-${autoIndex || Math.random()}`,
            status: 'good', // Default to "good" status
            quantity: quantity
        }

        // Local state update for UI
        setCurrentProductionItems(prev => ({
            ...prev,
            [recordId]: [...(prev[recordId] || []), newItem]
        }))
    }

    // Add a new function to generate all units at once
    const handleGenerateAllUnits = (recordId: string, totalUnits: number) => {
        for (let i = 0; i < totalUnits; i++) {
            handleAddProductionItem(recordId, 1, i);
        }
    }

    // Calculate financial stats
    const calculateFinancials = () => {
        let totalIncome = 0;
        let totalLoss = 0;
        let goodUnits = 0;
        let soldUnits = 0;
        let badUnits = 0;

        productionHistory.forEach(record => {

            console.log('thius is it ', record);

            const recipe = recipes.find(r => r.name === record.recipeName);
            const unitPrice = recipe?.sellingPrice || 0;


            //     // Find the recipe to get selling price
            // const recipe = recipes.find(r => r.name === record.recipeName);
            // const unitPrice = recipe?.sellingPrice || 0; // Get selling price from recipe

            // Combine record items with current production items
            const allItems = [...(record.items || []), ...(currentProductionItems[record.id] || [])];

            // If record has individual items, calculate per item

            if (allItems.length > 0) {
                allItems.forEach(item => {
                    if (item.status === 'sold') {
                        totalIncome += item.quantity * unitPrice;
                        soldUnits += item.quantity;
                    } else if (item.status === 'good') {
                        goodUnits += item.quantity;
                    } else {
                        totalLoss += item.quantity * unitPrice;
                        badUnits += item.quantity;
                    }
                });
            } else {
                // Fallback to record-level status

                if (record.status === 'sold') {
                    totalIncome += record.totalProduced * unitPrice;
                    soldUnits += record.totalProduced;
                } else if (record.status === 'good') {
                    goodUnits += record.totalProduced;
                } else {
                    totalLoss += record.totalProduced * unitPrice;
                    badUnits += record.totalProduced;
                }
            }
        });

        return { totalIncome, totalLoss, goodUnits, soldUnits, badUnits };
    };

    const { totalIncome, totalLoss, } = calculateFinancials();
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

    // Status configuration
    const statusConfig = {
        good: { label: 'Buen Estado', color: 'bg-green-100 border-green-500 text-green-800', income: false },
        sold: { label: 'Vendido', color: 'bg-blue-100 border-blue-500 text-blue-800', income: true },
        bad: { label: 'Malo', color: 'bg-red-100 border-red-500 text-red-800', income: false },
        burned: { label: 'Quemado', color: 'bg-orange-100 border-orange-500 text-orange-800', income: false },
        damaged: { label: 'Dañado', color: 'bg-purple-100 border-purple-500 text-purple-800', income: false }
    };

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


    console.log(" LOW STOCK ITEMS:", lowStockItems)

    // Helper to get combined items for a record
    const getCombinedRecordItems = (recordId: string) => {
        const record = productionHistory.find(r => r.id === recordId);
        const recordItems = record?.items || [];
        const currentItems = currentProductionItems[recordId] || [];
        return [...recordItems, ...currentItems];
    };


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
                                    todayProduction.map(record => {
                                        // Calculate status counts for display
                                        const recordItems = getCombinedRecordItems(record.id);
                                        const totalItems = recordItems.reduce((sum, item) => sum + item.quantity, 0);

                                        // Count items by status
                                        const statusCounts = {
                                            good: recordItems.filter(item => item.status === 'good').reduce((sum, item) => sum + item.quantity, 0),
                                            sold: recordItems.filter(item => item.status === 'sold').reduce((sum, item) => sum + item.quantity, 0),
                                            bad: recordItems.filter(item => item.status === 'bad' || item.status === 'burned' || item.status === 'damaged').reduce((sum, item) => sum + item.quantity, 0)
                                        };

                                        return (
                                            <div
                                                key={record.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold">{record.recipeName}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {record.batchCount} lote(s) - {record.totalProduced} unidades
                                                    </div>
                                                    {/* Show status summary */}
                                                    {totalItems > 0 && (
                                                        <div className="flex gap-2 mt-1 text-xs">
                                                            {statusCounts.good > 0 && (
                                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                                    Bueno: {statusCounts.good}
                                                                </span>
                                                            )}
                                                            {statusCounts.sold > 0 && (
                                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                                    Vendido: {statusCounts.sold}
                                                                </span>
                                                            )}
                                                            {statusCounts.bad > 0 && (
                                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                                    Defectuoso: {statusCounts.bad}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(record.date).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        )
                                    })
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
                                                Mínimo: {convertToReadableUnit(ingredient.minAmount, item.unit)}
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
                        <CardTitle className="flex items-center gap-2">
                            Control de Calidad - Producción Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {productionHistory.slice(0, 10).map(record => {
                                const isExpanded = expandedRecords.has(record.id);
                                const recordItems = [...(record.items || []), ...(currentProductionItems[record.id] || [])];
                                const totalItems = recordItems.reduce((sum, item) => sum + item.quantity, 0);

                                // Calculate status counts
                                const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
                                    acc[status] = recordItems
                                        .filter(item => item.status === status)
                                        .reduce((sum, item) => sum + item.quantity, 0);
                                    return acc;
                                }, {} as Record<string, number>);

                                return (
                                    <div
                                        key={record.id}
                                        className="border-2 border-gray-200 rounded-lg transition-all duration-200"
                                    >
                                        {/* Header - Clickable */}
                                        <div
                                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                            onClick={() => toggleRecord(record.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="font-semibold text-lg">{record.recipeName}</div>
                                                <div className="text-sm text-gray-600">
                                                    {record.batchCount} lote(s) - {record.totalProduced} unidades producidas
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {totalItems} unidades registradas en control de calidad
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {/* Status summary badges */}
                                                <div className="flex gap-1">
                                                    {Object.entries(statusConfig).map(([status, config]) => {
                                                        const count = statusCounts[status];
                                                        if (count > 0) {
                                                            return (
                                                                <div
                                                                    key={status}
                                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                                                                    title={`${config.label}: ${count} unidades`}
                                                                >
                                                                    {count}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expandable Content - Per Unit Quality Control */}
                                        {isExpanded && (
                                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-semibold">Control de Calidad por Unidad</h4>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddProductionItem(record.id);
                                                            }}
                                                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                                                        >
                                                            + Agregar Unidad
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Add multiple units at once
                                                                for (let i = 0; i < 5; i++) {
                                                                    handleAddProductionItem(record.id);
                                                                }
                                                            }}
                                                            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
                                                        >
                                                            + 5 Unidades
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Units Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                                    {recordItems.map((item) => {
                                                        const statusInfo = statusConfig[item.status];
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`p-3 rounded-lg border-2 ${statusInfo.color} transition-colors duration-200`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="font-medium">
                                                                        {record.recipeName}
                                                                        {/* Unidad #{index + 1}  // aqui */}
                                                                    </div>
                                                                    <div className="text-sm font-semibold">
                                                                        {item.quantity}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium block">
                                                                        Estado:
                                                                    </label>
                                                                    <select
                                                                        value={item.status}
                                                                        onChange={(e) => handleItemStatusChange(record.id, item.id, e.target.value as ProductionStatus)}
                                                                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    >
                                                                        {Object.entries(statusConfig).map(([status, config]) => (
                                                                            <option key={status} value={status}>
                                                                                {config.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                {/* Quick action buttons */}
                                                                {/* <div className="flex gap-1 mt-3">
                                                                    {Object.entries(statusConfig).map(([status, config]) => (
                                                                        <button
                                                                            key={status}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleItemStatusChange(record.id, item.id, status as ProductionStatus);
                                                                            }}
                                                                            className={`flex-1 text-xs px-2 py-1 rounded border transition-colors ${item.status === status
                                                                                ? 'bg-white font-bold'
                                                                                : 'bg-gray-100 hover:bg-gray-200'
                                                                                }`}
                                                                        >
                                                                            {config.label.slice(0, 3)}
                                                                        </button>
                                                                    ))}
                                                                </div> */}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {/* Add new unit form */}
                                                {recordItems.length === 0 && (
                                                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                                        <p className="text-gray-500 mb-3">
                                                            {record.totalProduced} unidades producidas - Listar para control de calidad
                                                        </p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleGenerateAllUnits(record.id, record.totalProduced);
                                                            }}
                                                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                                                        >
                                                            Listar {record.totalProduced} Unidades para Control
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Batch Summary */}
                                                {recordItems.length > 0 && (
                                                    <div className="mt-4 p-4 bg-white rounded-lg border">
                                                        <h5 className="font-semibold mb-3 text-center">Resumen del Lote</h5>
                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                            {Object.entries(statusConfig).map(([status, config]) => {
                                                                const quantity = statusCounts[status];
                                                                const percentage = totalItems > 0 ? (quantity / totalItems * 100).toFixed(1) : '0';
                                                                return (
                                                                    <div
                                                                        key={status}
                                                                        className={`p-3 rounded-lg text-center border-2 ${config.color} transition-all duration-200 ${quantity > 0 ? 'scale-105 shadow-md' : ''
                                                                            }`}
                                                                    >
                                                                        <div className="text-2xl font-bold">{quantity}</div>
                                                                        <div className="text-sm font-medium">{config.label}</div>
                                                                        <div className="text-xs opacity-75">{percentage}%</div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-2 mt-4 gap-4">


                                                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-4 text-center">
                                                                <div className="text-2xl font-bold text-amber-700">${totalIncome.toFixed(2)}</div>
                                                                <div className="text-sm text-amber-600">Ingresos (Vendido)</div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 text-center">
                                                                <div className="text-2xl font-bold text-red-700">${totalLoss.toFixed(2)}</div>
                                                                <div className="text-sm text-red-600">Pérdidas (Defectuoso)</div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 text-center text-sm text-gray-600">
                                                            Total unidades verificadas: <strong>{totalItems}</strong> de <strong>{record.totalProduced}</strong> producidas
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Production Stats */}

                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {productionHistory.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No hay historial de producción para control de calidad
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>

    )
}
