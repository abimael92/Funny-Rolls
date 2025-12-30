"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Package, TrendingUp, ChevronDown, ChevronUp,
    Calendar, CalendarDays, CalendarRange,
    ChevronLeft, ChevronRight, BarChart3
} from "lucide-react"
import { Ingredient, Recipe, ProductionRecord, InventoryItem } from '@/lib/types'
import { UnitConverter } from '../../lib/unit-conversion'
import { CustomSelect } from './CustomSelect'

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
type TimeView = 'daily' | 'weekly' | 'monthly'

export function ProductionTrackerPanel({
    productionHistory,
    inventory,
    ingredients,
    recipes,
    updateProductionStatus
}: ProductionTrackerPanelProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())
    const [currentProductionItems, setCurrentProductionItems] = useState<{ [recordId: string]: ProductionItem[] }>({})
    const [timeView, setTimeView] = useState<TimeView>('daily')
    const [allProductionData, setAllProductionData] = useState<ProductionRecord[]>(productionHistory)

    // Initialize with productionHistory
    useEffect(() => {
        setAllProductionData(productionHistory)
    }, [productionHistory])

    // Toggle accordion
    const toggleRecord = (recordId: string) => {
        const newExpanded = new Set(expandedRecords)
        if (newExpanded.has(recordId)) {
            newExpanded.delete(recordId)
        } else {
            newExpanded.add(recordId)
        }
        setExpandedRecords(newExpanded)
    }

    // Update the status change handler for individual items
    const handleItemStatusChange = (recordId: string, itemId: string, status: ProductionStatus) => {
        // Update local state
        setCurrentProductionItems(prev => ({
            ...prev,
            [recordId]: (prev[recordId] || []).map(item =>
                item.id === itemId ? { ...item, status } : item
            )
        }))

        // Call the prop function if provided
        if (updateProductionStatus) {
            updateProductionStatus(recordId, itemId, status)
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
            handleAddProductionItem(recordId, 1, i)
        }
    }

    // Calculate financial stats
    const calculateFinancials = () => {
        let totalIncome = 0
        let totalLoss = 0
        let goodUnits = 0
        let soldUnits = 0
        let badUnits = 0

        allProductionData.forEach(record => {
            const recipe = recipes.find(r => r.name === record.recipeName)
            const unitPrice = recipe?.sellingPrice || 0

            // Combine record items with current production items
            const allItems = [...(record.items || []), ...(currentProductionItems[record.id] || [])]

            // If record has individual items, calculate per item
            if (allItems.length > 0) {
                allItems.forEach(item => {
                    if (item.status === 'sold') {
                        totalIncome += item.quantity * unitPrice
                        soldUnits += item.quantity
                    } else if (item.status === 'good') {
                        goodUnits += item.quantity
                    } else {
                        totalLoss += item.quantity * unitPrice
                        badUnits += item.quantity
                    }
                })
            } else {
                // Fallback to record-level status
                if (record.status === 'sold') {
                    totalIncome += record.totalProduced * unitPrice
                    soldUnits += record.totalProduced
                } else if (record.status === 'good') {
                    goodUnits += record.totalProduced
                } else {
                    totalLoss += record.totalProduced * unitPrice
                    badUnits += record.totalProduced
                }
            }
        })

        return { totalIncome, totalLoss, goodUnits, soldUnits, badUnits }
    }

    const { totalIncome, totalLoss } = calculateFinancials()

    // Calculate total production stats
    const totalBatches = allProductionData.reduce((sum, record) => sum + record.batchCount, 0)
    const totalProduced = allProductionData.reduce((sum, record) => sum + record.totalProduced, 0)

    // Filter production history by selected time period
    const getFilteredProduction = () => {
        const selectedDateObj = new Date(selectedDate)

        if (timeView === 'daily') {
            return allProductionData.filter(record =>
                record.date.startsWith(selectedDate)
            )
        } else if (timeView === 'weekly') {
            const weekStart = new Date(selectedDateObj)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Start Monday
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)

            return allProductionData.filter(record => {
                const recordDate = new Date(record.date)
                return recordDate >= weekStart && recordDate <= weekEnd
            })
        } else { // monthly
            const monthStart = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1)
            const monthEnd = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0)

            return allProductionData.filter(record => {
                const recordDate = new Date(record.date)
                return recordDate >= monthStart && recordDate <= monthEnd
            })
        }
    }

    const filteredProduction = getFilteredProduction()

    // Get low stock items
    const lowStockItems = inventory.filter(item => {
        const ingredient = ingredients.find(ing => ing.id === item.ingredientId)
        return ingredient && item.currentStock <= ingredient.minAmount
    })

    // Status configuration
    const statusConfig = {
        good: { label: 'Buen Estado', color: 'bg-green-100 border-green-500 text-green-800', income: false },
        sold: { label: 'Vendido', color: 'bg-blue-100 border-blue-500 text-blue-800', income: true },
        bad: { label: 'Malo', color: 'bg-red-100 border-red-500 text-red-800', income: false },
        burned: { label: 'Quemado', color: 'bg-orange-100 border-orange-500 text-orange-800', income: false },
        damaged: { label: 'Dañado', color: 'bg-purple-100 border-purple-500 text-purple-800', income: false }
    }

    // Conversion function
    const convertToReadableUnit = (amount: number, unit: string): string => {
        // For small amounts, convert to more appropriate units
        if (unit === 'kg' && amount < 1) {
            const converted = UnitConverter.convert({ value: amount, unit: 'kg' }, 'g')
            return converted ? `${converted.value.toFixed(0)}g` : `${amount} ${unit}`
        }

        if ((unit === 'l' || unit === 'litro') && amount < 1) {
            const converted = UnitConverter.convert({ value: amount, unit: 'l' }, 'ml')
            return converted ? `${converted.value.toFixed(0)}ml` : `${amount} ${unit}`
        }

        if (unit === 'docena' && amount < 1) {
            const converted = UnitConverter.convert({ value: amount, unit: 'docena' }, 'unidad')
            return converted ? `${converted.value.toFixed(0)} unidades` : `${amount} ${unit}`
        }

        // Return original if no conversion needed or conversion fails
        return `${amount} ${unit}`
    }

    // Helper to get combined items for a record
    const getCombinedRecordItems = (recordId: string) => {
        const record = allProductionData.find(r => r.id === recordId)
        const recordItems = record?.items || []
        const currentItems = currentProductionItems[recordId] || []
        return [...recordItems, ...currentItems]
    }

    // Navigation functions
    const navigateTime = (direction: 'prev' | 'next') => {
        const date = new Date(selectedDate)

        if (timeView === 'daily') {
            date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
        } else if (timeView === 'weekly') {
            date.setDate(date.getDate() + (direction === 'next' ? 7 : -7))
        } else { // monthly
            date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1))
        }

        setSelectedDate(date.toISOString().split('T')[0])
    }

    // Format date display based on view
    const getFormattedDate = () => {
        const date = new Date(selectedDate)

        if (timeView === 'daily') {
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } else if (timeView === 'weekly') {
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay() + 1)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)

            return `${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
        } else { // monthly
            return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        }
    }

    // Get production summary for the current view
    const getProductionSummary = () => {
        const summary = {
            batches: 0,
            units: 0,
            income: 0,
            loss: 0
        }

        filteredProduction.forEach(record => {
            summary.batches += record.batchCount
            summary.units += record.totalProduced

            const recipe = recipes.find(r => r.name === record.recipeName)
            const unitPrice = recipe?.sellingPrice || 0

            const items = getCombinedRecordItems(record.id)
            items.forEach(item => {
                if (item.status === 'sold') {
                    summary.income += item.quantity * unitPrice
                } else if (item.status !== 'good') {
                    summary.loss += item.quantity * unitPrice
                }
            })
        })

        return summary
    }
    
    // Add this function to your ProductionTrackerPanel component
    const getDatesWithData = () => {
        const datesWithData = new Set<string>();

        allProductionData.forEach(record => {
            const dateStr = record.date.split('T')[0]; // Extract YYYY-MM-DD
            datesWithData.add(dateStr);
        });

        return datesWithData;
    };

    const summary = getProductionSummary()

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">Seguimiento de Producción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Time Navigation */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => navigateTime('prev')}
                                className="p-2 rounded-lg hover:bg-white transition-colors shadow-sm"
                                title="Anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div className="text-center flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">{getFormattedDate()}</h3>
                                <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                                    {timeView === 'daily' ? 'Vista Diaria' :
                                        timeView === 'weekly' ? 'Vista Semanal' : 'Vista Mensual'}
                                    {/* Show if current date has data */}
                                    {getDatesWithData().has(selectedDate) && (
                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            Datos disponibles
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => navigateTime('next')}
                                className="p-2 rounded-lg hover:bg-white transition-colors shadow-sm"
                                title="Siguiente"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={() => setTimeView('daily')}
                                className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${timeView === 'daily'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-white hover:bg-blue-50 border border-gray-200'
                                    }`}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="text-sm">Día</span>
                            </button>

                            <button
                                onClick={() => setTimeView('weekly')}
                                className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${timeView === 'weekly'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-white hover:bg-blue-50 border border-gray-200'
                                    }`}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span className="text-sm">Semana</span>
                            </button>

                            <button
                                onClick={() => setTimeView('monthly')}
                                className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${timeView === 'monthly'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-white hover:bg-blue-50 border border-gray-200'
                                    }`}
                            >
                                <CalendarRange className="h-3.5 w-3.5" />
                                <span className="text-sm">Mes</span>
                            </button>
                        </div>

                        {/* Enhanced Date Picker with Visual Indicators */}
                        <div className="relative group">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className={`px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm pr-10 transition-colors
                    ${getDatesWithData().has(selectedDate)
                                        ? 'border-green-400 focus:border-green-500'
                                        : 'border-gray-300'
                                    }`}
                            />
                            {/* Visual indicator dot */}
                            {getDatesWithData().has(selectedDate) && (
                                <>
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                                    </div>
                                    <div className="absolute -bottom-6 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ✓ Datos de producción disponibles
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Date Navigation Bar - Shows ALL dates with data */}
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-600">Días con producción:</span>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-500">{getDatesWithData().size} días con datos</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                            {/* Convert Set to Array, sort by date (newest first), and display */}
                            {Array.from(getDatesWithData())
                                .sort((a, b) => b.localeCompare(a)) // Most recent first
                                .map(dateStr => {
                                    const date = new Date(dateStr);
                                    const dayData = allProductionData.filter(
                                        record => record.date.startsWith(dateStr)
                                    );

                                    // Change this calculation to be deterministic
                                    const totalUnits = dayData.reduce((sum, record) => {
                                        return sum + (record.batchCount * 12); // Fixed calculation
                                    }, 0);

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => {
                                                setSelectedDate(dateStr);
                                                setTimeView('daily');
                                            }}
                                            className={`px-2 py-1 text-xs rounded-lg transition-all duration-200 flex items-center gap-1
                                ${selectedDate === dateStr
                                                    ? 'bg-blue-500 text-white shadow-md'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                }`}
                                            title={`${date.toLocaleDateString('es-ES')}: ${totalUnits} unidades producidas`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${totalUnits > 30 ? 'bg-green-600' :
                                                    totalUnits > 15 ? 'bg-green-500' :
                                                        totalUnits > 5 ? 'bg-green-400' : 'bg-green-300'
                                                }`}></div>
                                            {date.toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                            {/* <span className="text-[10px] opacity-75">({totalUnits})</span> */}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Production Stats - Original Layout */}
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
                        <div className="text-2xl font-bold text-amber-700">{allProductionData.length}</div>
                        <div className="text-sm text-amber-600">Días de Producción</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{lowStockItems.length}</div>
                        <div className="text-sm text-red-600">Stock Bajo</div>
                    </div>
                </div>

                {/* View-specific Stats */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="text-center mb-2">
                        <span className="text-sm font-medium text-gray-600">
                            Resumen para {timeView === 'daily' ? 'el día' : timeView === 'weekly' ? 'la semana' : 'el mes'}:
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="text-lg font-bold text-blue-600">{summary.batches}</div>
                            <div className="text-xs text-gray-500">Lotes</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="text-lg font-bold text-green-600">{summary.units}</div>
                            <div className="text-xs text-gray-500">Unidades</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="text-lg font-bold text-amber-600">${summary.income.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Ingresos</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="text-lg font-bold text-red-600">${summary.loss.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Pérdidas</div>
                        </div>
                    </div>
                </div>

                <div className="lg:grid lg:grid-cols-3 lg:gap-6 xl:gap-8 space-y-6 lg:space-y-0">
                    {/* Production History - FILTERED BY TIME VIEW */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Historial de Producción
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({timeView === 'daily' ? 'Día' : timeView === 'weekly' ? 'Semana' : 'Mes'})
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Datos para {timeView === 'daily' ? 'el día' : timeView === 'weekly' ? 'la semana' : 'el mes'} de:
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {filteredProduction.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No hay producción registrada para {timeView === 'daily' ? 'este día' : timeView === 'weekly' ? 'esta semana' : 'este mes'}
                                    </div>
                                ) : (
                                    filteredProduction.map(record => {
                                        // Calculate status counts for display
                                        const recordItems = getCombinedRecordItems(record.id)
                                        const totalItems = recordItems.reduce((sum, item) => sum + item.quantity, 0)

                                        // Count items by status
                                        const statusCounts = {
                                            good: recordItems.filter(item => item.status === 'good').reduce((sum, item) => sum + item.quantity, 0),
                                            sold: recordItems.filter(item => item.status === 'sold').reduce((sum, item) => sum + item.quantity, 0),
                                            bad: recordItems.filter(item => item.status === 'bad' || item.status === 'burned' || item.status === 'damaged').reduce((sum, item) => sum + item.quantity, 0)
                                        }

                                        return (
                                            <div
                                                key={record.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold">{record.recipeName}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {record.batchCount} lote(s) - {record.totalProduced} unidades
                                                    </div>
                                                    {/* Show status summary */}
                                                    {totalItems > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-1 text-xs">
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
                    <Card className="lg:col-span-1">
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
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-gray-800 whitespace-nowrap">
                                                    Stock actual:
                                                </div>
                                                <div className="flex items-center gap-2 bg-grey-100 border-2 border-amber-300/60 rounded-lg px-3 py-2 w-[90px] cursor-not-allowed opacity-90">
                                                    <span className="w-20 text-center text-base font-bold text-amber-900">
                                                        {item.currentStock.toFixed(2)}
                                                    </span>
                                                    <span className="text-base text-amber-700 font-semibold">{item.unit}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-red-800 font-medium px-3 py-2 rounded-lg mt-1">
                                                Mínimo: {convertToReadableUnit(ingredient.minAmount, item.unit)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Production - ORIGINAL FUNCTIONALITY PRESERVED */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Control de Calidad - Producción Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {allProductionData.slice(0, 10).map(record => {
                                const isExpanded = expandedRecords.has(record.id)
                                const recordItems = [...(record.items || []), ...(currentProductionItems[record.id] || [])]
                                const totalItems = recordItems.reduce((sum, item) => sum + item.quantity, 0)

                                // Calculate status counts
                                const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
                                    acc[status] = recordItems
                                        .filter(item => item.status === status)
                                        .reduce((sum, item) => sum + item.quantity, 0)
                                    return acc
                                }, {} as Record<string, number>)

                                return (
                                    <div
                                        key={record.id}
                                        className="border-2 border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300"
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
                                                        const count = statusCounts[status]
                                                        if (count > 0) {
                                                            return (
                                                                <div
                                                                    key={status}
                                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                                                                    title={`${config.label}: ${count} unidades`}
                                                                >
                                                                    {count}
                                                                </div>
                                                            )
                                                        }
                                                        return null
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
                                                                e.stopPropagation()
                                                                handleAddProductionItem(record.id)
                                                            }}
                                                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                                                        >
                                                            + Agregar Unidad
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                // Add multiple units at once
                                                                for (let i = 0; i < 5; i++) {
                                                                    handleAddProductionItem(record.id)
                                                                }
                                                            }}
                                                            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
                                                        >
                                                            + 5 Unidades
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Units Grid - SHOWS INDIVIDUAL UNIT STATUS */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-6 p-4">
                                                    {recordItems.map((item, index) => {
                                                        const statusInfo = statusConfig[item.status]
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`p-3 rounded-lg border-2 ${statusInfo.color} transition-colors duration-200 hover:scale-[1.02]`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="font-medium">
                                                                        {record.recipeName} - Unidad {index + 1}
                                                                    </div>
                                                                    <div className="text-sm font-semibold">
                                                                        {item.quantity}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium block">
                                                                        Estado:
                                                                    </label>
                                                                    <CustomSelect
                                                                        value={item.status}
                                                                        onChange={(value) => handleItemStatusChange(record.id, item.id, value as ProductionStatus)}
                                                                        options={Object.entries(statusConfig).map(([status, config]) => ({
                                                                            value: status,
                                                                            label: config.label
                                                                        }))}
                                                                        placeholder="Seleccionar estado"
                                                                        color="gray"
                                                                        className="w-full"
                                                                        showFullName={false}
                                                                    />
                                                                </div>

                                                                {/* Quick action buttons */}
                                                                {/* <div className="flex gap-1 mt-3">
                                                                    {Object.entries(statusConfig).map(([status, config]) => (
                                                                        <button
                                                                            key={status}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                handleItemStatusChange(record.id, item.id, status as ProductionStatus)
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
                                                                e.stopPropagation()
                                                                handleGenerateAllUnits(record.id, record.totalProduced)
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
                                                                const quantity = statusCounts[status]
                                                                const percentage = totalItems > 0 ? (quantity / totalItems * 100).toFixed(1) : '0'
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
                                                                )
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
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {allProductionData.length === 0 && (
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