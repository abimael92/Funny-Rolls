"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Info, Save, Trash2, Zap, Utensils, Star, DollarSign, Edit } from "lucide-react";
import { Tool, TOOL_CATEGORY_CONFIGS } from '@/lib/types';
import { toolCategories } from '@/lib/data';
import { CloseButton, ActionButton } from './ModalHelpers';
import { EditableToolRow } from './EditableToolRow';
import { CustomSelect } from './CustomSelect';
import { CustomNumberInput } from './CustomNumberInput';

interface ToolsPanelProps {
    tools: Tool[]
    setTools: (tools: Tool[]) => void
    saveToolToSupabase?: (tool: Tool) => Promise<Tool>
    deleteToolFromSupabase?: (toolId: string) => Promise<void>
    toolsInDatabase?: Set<string>
}

export function ToolsPanel({ tools, setTools, saveToolToSupabase, deleteToolFromSupabase, toolsInDatabase = new Set() }: ToolsPanelProps) {
    const [error, setError] = useState<string | null>(null);
    const [showAddSection, setShowAddSection] = useState(false);
    const [editingToolId, setEditingToolId] = useState<string | null>(null)
    const [showTotalToolsModal, setShowTotalToolsModal] = useState(false);
    const [showToolsCostModal, setShowToolsCostModal] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const [newTool, setNewTool] = useState<Omit<Tool, 'id'>>(() => {
        const defaultCategory = 'general';
        const categoryConfig = TOOL_CATEGORY_CONFIGS[defaultCategory];
        const totalBatches = categoryConfig.batchesPerYear * categoryConfig.yearsLifespan;

        return {
            name: '',
            type: 'herramienta',
            category: defaultCategory,
            cost: 0,
            description: '',
            lifetime: `${categoryConfig.yearsLifespan} años (${totalBatches} lotes)`,
            recoveryValue: 0,
            totalInvestment: 0,
            totalBatches: totalBatches,
            costPerBatch: 0,
        };
    });


    // Total Investment = Recovery Value × 10
    // Actual Cost = Total Investment - Recovery Value
    // Batches per Year = 52
    // Total Batches = Years × 52
    //     Cost / Batch = Actual Cost ÷ Total Batches

    // Add new tool
    const addTool = () => {
        setError(null)

        if (!newTool.name.trim()) {
            setError('El nombre de la herramienta es requerido')
            return
        }

        const tool: Tool = {
            ...newTool,
            id: Date.now().toString()
        }
        setTools([...tools, tool])

        const categoryConfig = TOOL_CATEGORY_CONFIGS[newTool.category] || TOOL_CATEGORY_CONFIGS.general;
        const totalBatches = categoryConfig.batchesPerYear * categoryConfig.yearsLifespan;

        setNewTool({
            name: '',
            type: newTool.type,
            category: newTool.category,
            description: '',
            lifetime: `${categoryConfig.yearsLifespan} años (${totalBatches} lotes)`,
            recoveryValue: 0,
            totalInvestment: 0,
            totalBatches: totalBatches,
            costPerBatch: 0,
        });

        setShowAddSection(false)
    }

    // Remove tool
    const removeTool = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta herramienta?')) {
            setTools(tools.filter(tool => tool.id !== id))
        }
    }

    // Save edited tool
    const saveEditedTool = (updatedTool: Tool) => {
        setTools(tools.map(tool =>
            tool.id === updatedTool.id ? updatedTool : tool
        ))
        setEditingToolId(null)
    }

    // Start editing tool
    const startEditingTool = (tool: Tool) => {
        setEditingToolId(tool.id)
    }

    const toggleTooltip = (fieldName: string) => {
        setActiveTooltip(activeTooltip === fieldName ? null : fieldName);
    };



    // Get tool color based on type
    const getToolColor = (type: string) => {
        switch (type) {
            case 'consumible': return 'bg-blue-50 border-blue-200 hover:border-blue-400'
            case 'herramienta': return 'bg-green-50 border-green-200 hover:border-green-400'
            case 'equipo': return 'bg-purple-50 border-purple-200 hover:border-purple-400'
            default: return 'bg-gray-50 border-gray-200 hover:border-gray-400'
        }
    }

    // Get tool icon based on type
    const getToolIcon = (type: string) => {
        switch (type) {
            case 'consumible': return <Zap className="h-4 w-4 text-blue-600" />
            case 'herramienta': return <Utensils className="h-4 w-4 text-green-600" /> // Fixed
            case 'equipo': return <Star className="h-4 w-4 text-purple-600" />
            default: return <Utensils className="h-4 w-4 text-gray-600" />
        }
    }

    // Get badge color based on type
    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'consumible': return 'bg-blue-100 text-blue-800'
            case 'herramienta': return 'bg-green-100 text-green-800'
            case 'equipo': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getCostExplanation = (tool: Tool) => {
        const costPerBatch = tool.costPerBatch?.toFixed(2) || '0.00';

        if (tool.type === 'consumible') {
            return `Costo operacional directo: $${costPerBatch} MXN/lote\n${tool.description}`;
        }

        return `Costo amortizado: $${costPerBatch} MXN/lote\nInversión: $${tool.totalInvestment} MXN\n${tool.lifetime}\nValor rescate: $${tool.recoveryValue} MXN`;
    };

    return (
        <div className="space-y-6">
            {/* Add New Tool Section */}
            <div className="mb-4 overflow-hidden">
                <div
                    onClick={() => setShowAddSection(!showAddSection)}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-2 px-4 cursor-pointer flex items-center justify-center transition-all duration-300 ease-out relative ${showAddSection ? 'rounded-t-lg' : 'rounded-lg'}`}
                >
                    <div className="flex items-center">
                        {showAddSection ? 'Cancelar' : 'Agregar Herramienta'}
                    </div>
                    <ChevronDown className={`h-6 w-6 absolute right-4 transition-transform duration-300 ease-out ${showAddSection ? '-rotate-180' : ''}`} />
                </div>

                <div className={`transition-all duration-500 ease-out overflow-hidden ${showAddSection ? 'max-h-106 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 bg-blue-50 rounded-b-lg border border-blue-300 border-t-0 max-h-80 overflow-y-auto overflow-x-hidden">
                        <h3 className="font-semibold text-lg text-blue-800 text-center mb-4">Agregar Herramienta</h3>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
                                {error}
                            </div>
                        )}

                        {/* Tools Forms */}
                        <div className="space-y-4">

                            {/* Name Input with Label */}
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Nombre de la herramienta *
                                    <span className="ml-1 relative group">
                                        <Info
                                            className="h-4 w-4 inline text-blue-500 cursor-help tooltip-icon"
                                            onClick={() => toggleTooltip('name')}
                                        />
                                        {activeTooltip === 'name' && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-nowrap">
                                                {`Nombre de la herramienta o equipo`}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        )}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Batidora profesional"
                                    value={newTool.name}
                                    onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>

                            {/* Type and Category with Labels */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">
                                        Tipo *
                                        <span className="ml-1 relative">
                                            <Info
                                                className="h-4 w-4 inline text-blue-500 cursor-help tooltip-icon"
                                                onClick={() => toggleTooltip('type')}
                                            />
                                            {activeTooltip === 'type' && (
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-pre-line tooltip-content ">
                                                    <span className="font-bold text-sm">Consumible</span>: costo operacional directo<br />
                                                    <span className="font-bold text-sm">Utensilio/Equipo</span>: costo amortizado
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                            )}
                                        </span>
                                    </label>
                                    {/* Type Selector */}
                                    <CustomSelect
                                        value={newTool.type}
                                        onChange={(selectedValue) => {
                                            const newType = selectedValue as 'consumible' | 'herramienta' | 'equipo';

                                            // FIX: Use type assertion to access toolCategories
                                            const categories = (toolCategories as Record<string, Array<{ value: string; label: string }>>)[newType] || [];
                                            const defaultCategory = categories[0]?.value || 'general';

                                            const categoryConfig = TOOL_CATEGORY_CONFIGS[defaultCategory];
                                            const totalBatches = categoryConfig.batchesPerYear * categoryConfig.yearsLifespan;

                                            setNewTool({
                                                ...newTool,
                                                type: newType,
                                                category: defaultCategory,
                                                lifetime: `${categoryConfig.yearsLifespan} años (${totalBatches} lotes)`,
                                                totalBatches: totalBatches,
                                                recoveryValue: 0,
                                                totalInvestment: 0,
                                                costPerBatch: 0,
                                            });
                                        }}
                                        options={[
                                            { value: 'consumible', label: 'Consumible' },
                                            { value: 'herramienta', label: 'Utensilio' }, // UI shows "Utensilio" but value is "herramienta"
                                            { value: 'equipo', label: 'Equipo' }
                                        ]}
                                        placeholder="Seleccionar tipo"
                                        color="blue"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">
                                        Categoría *
                                        <span className="ml-1 relative">
                                            <Info
                                                className="h-4 w-4 inline text-blue-500 cursor-help tooltip-icon"
                                                onClick={() => toggleTooltip('category')}
                                            />
                                            {activeTooltip === 'category' && (
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-pre-line tooltip-content">
                                                    <span>Organiza herramientas por función o tipo de uso</span>
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                            )}
                                        </span>
                                    </label>
                                    {/* Category Selector */}
                                    <CustomSelect
                                        value={newTool.category}
                                        onChange={(newCategory) => {
                                            const categoryConfig = TOOL_CATEGORY_CONFIGS[newCategory] || TOOL_CATEGORY_CONFIGS.general;
                                            const totalBatches = categoryConfig.batchesPerYear * categoryConfig.yearsLifespan;

                                            setNewTool({
                                                ...newTool,
                                                category: newCategory,
                                                lifetime: `${categoryConfig.yearsLifespan} años (${totalBatches} lotes)`,
                                                totalBatches: totalBatches,

                                                ...(newTool.totalInvestment > 0 && {
                                                    recoveryValue: Math.round(newTool.totalInvestment * categoryConfig.recoveryRate),
                                                    costPerBatch: Number(((newTool.totalInvestment - Math.round(newTool.totalInvestment * categoryConfig.recoveryRate)) / totalBatches).toFixed(2)),
                                                    cost: Number(((newTool.totalInvestment - Math.round(newTool.totalInvestment * categoryConfig.recoveryRate)) / totalBatches).toFixed(2))
                                                })
                                            });
                                        }}
                                        options={
                                            // FIX: Use type assertion (toolCategories as any)[newTool.type]
                                            ((toolCategories as Record<string, Array<{ value: string; label: string }>>)[newTool.type] || []).map((category) => ({
                                                value: category.value,
                                                label: category.label
                                            }))
                                        }
                                        placeholder={
                                            !newTool.type
                                                ? "Primero selecciona un tipo"
                                                : (toolCategories[newTool.type as keyof typeof toolCategories]?.length > 0)
                                                    ? "Seleccionar categoría"
                                                    : "No hay categorías disponibles"
                                        }
                                        color="blue"
                                        className="w-full"
                                        disabled={!newTool.type}
                                    />
                                </div>
                            </div>

                            {/* Cost Input with Helper */}
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Inversión total (MXN)
                                    <span className="ml-1 relative">
                                        <Info
                                            className="h-4 w-4 inline text-blue-500 cursor-help tooltip-icon"
                                            onClick={() => toggleTooltip('investment')}
                                        />
                                        {activeTooltip === 'investment' && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-nowrap">
                                                Costo total de compra de la herramienta
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        )}
                                    </span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10 pointer-events-none">
                                        $
                                    </div>
                                    <CustomNumberInput
                                        value={newTool.totalInvestment || 0}
                                        onChange={(investment) => {
                                            const updatedTool = { ...newTool, totalInvestment: investment };

                                            if (newTool.type !== 'consumible') {
                                                const categoryConfig = TOOL_CATEGORY_CONFIGS[newTool.category] || TOOL_CATEGORY_CONFIGS.general;
                                                const totalBatches = categoryConfig.batchesPerYear * categoryConfig.yearsLifespan;
                                                const recoveryValue = Math.round(investment * categoryConfig.recoveryRate);

                                                const costPerBatch = investment > 0 ?
                                                    Number(((investment - recoveryValue) / totalBatches).toFixed(2)) : 0;

                                                updatedTool.recoveryValue = recoveryValue;
                                                updatedTool.totalBatches = totalBatches;
                                                updatedTool.costPerBatch = costPerBatch;
                                                updatedTool.lifetime = `${categoryConfig.yearsLifespan} años (${totalBatches} lotes)`;
                                            }

                                            setNewTool(updatedTool);
                                        }}
                                        min={0}
                                        max={1000000}
                                        placeholder="0"
                                        allowDecimals={false}
                                        color="blue"
                                        className="w-full pl-8 pr-3 h-10 sm:h-11 border-2 border-blue-300 rounded-lg bg-blue-50 shadow-sm" // Changed height and bg
                                    />
                                </div>
                            </div>

                            {/* Investment Details for Non-Consumables */}
                            {newTool.type !== 'consumible' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                                    {/* Auto-calculation notice */}
                                    <div className="md:col-span-2 text-xs text-blue-800 mb-2">
                                        El costo por lote se calcula automáticamente:<br />
                                        <strong>(Inversión - Valor rescate) / Lotes totales</strong>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                            Valor de rescate (MXN)
                                            <span className="ml-1 relative">
                                                <Info
                                                    className="h-4 w-4 inline text-blue-500 cursor-help tooltip-icon"
                                                    onClick={() => toggleTooltip('recovery')}
                                                />
                                                {activeTooltip === 'recovery' && (
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-pre-line tooltip-content">
                                                        Valor estimado de reventa al final de la vida útil
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                )}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                step="1"
                                                min="0"
                                                readOnly
                                                placeholder="0"
                                                value={newTool.recoveryValue || ''}
                                                onChange={(e) => {
                                                    const recoveryValue = Number(e.target.value) || 0;
                                                    const updatedTool = { ...newTool, recoveryValue };

                                                    // FIXED: Recalculate cost per batch when recovery value changes
                                                    if (newTool.totalInvestment > 0 && newTool.totalBatches) {
                                                        const costPerBatch = Number(((newTool.totalInvestment - recoveryValue) / newTool.totalBatches).toFixed(2));
                                                        updatedTool.costPerBatch = costPerBatch;
                                                    }

                                                    setNewTool(updatedTool);
                                                }}
                                                className="w-full pl-8 pr-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                            Costo por lote (MXN)
                                            <span className="ml-1 relative">
                                                <Info
                                                    className="h-4 w-4 inline text-blue-500 cursor-help tooltip-icon"
                                                    onClick={() => toggleTooltip('costPerBatch')}
                                                />
                                                {activeTooltip === 'costPerBatch' && (
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-10 whitespace-pre-line tooltip-content">
                                                        Costo amortizado por lote. Se calcula automáticamente basado en la inversión y vida útil
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                )}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                readOnly
                                                placeholder="0.00"
                                                value={newTool.costPerBatch || ''}
                                                onChange={(e) => {
                                                    const cost = Number(e.target.value) || 0;
                                                    setNewTool({
                                                        ...newTool,
                                                        costPerBatch: cost
                                                    });
                                                }}
                                                className="w-full pl-8 pr-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>

                                    </div>

                                    <div className="md:col-span-2 text-xs text-gray-500 mt-1">
                                        Basado en {newTool.totalBatches} lotes totales



                                        {/*     <>{(newTool.totalInvestment && newTool.costPerBatch)
                                            ? Math.ceil((newTool.totalInvestment - (newTool.recoveryValue || 0)) / newTool.costPerBatch)
                                            : 'Ingresa una inversión y costo por lote'}
                                        </>*/}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Descripción
                                    <span className="text-xs text-blue-500 ml-1">- Opcional</span>
                                </label>
                                <textarea
                                    placeholder="Describe la herramienta, su uso específico, o cualquier detalle importante..."
                                    value={newTool.description}
                                    onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">

                                <Button
                                    onClick={addTool}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-3"
                                // disabled={!newTool.name.trim()}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Quick Add Default Tools */}
            {/* {availableDefaultTools.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-gray-800 mb-3">Herramientas Predefinidas</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableDefaultTools.slice(0, 6).map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => addDefaultTool(tool)}
                                    className="flex items-center gap-2 p-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                >
                                    <span className="flex-1 truncate">{tool.name}</span>
                                    <Plus className="h-3 w-3 text-green-600 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )} */}

            {/* Divider */}
            <div className="relative flex items-center my-6">
                <div className="flex-grow border-t border-blue-300"></div>
                <span className="mx-3 text-blue-600 text-base sm:text-lg font-medium">Lista de Herramientas</span>
                <div className="flex-grow border-t border-blue-300"></div>
            </div>

            {/* Tools List */}
            <div className="space-y-4 max-h-292 overflow-y-auto pr-2">
                {tools.map((tool) => {
                    const categoryLabel = toolCategories[tool.type as keyof typeof toolCategories]?.find(cat => cat.value === tool.category)?.label || 'General'

                    return (
                        <div
                            key={tool.id}
                            className={`group relative border-2 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-lg ${getToolColor(tool.type)}`}
                        >
                            {editingToolId === tool.id ? (
                                <EditableToolRow
                                    key='EditableToolRow'
                                    tool={tool}
                                    onSave={saveEditedTool}
                                    onCancel={() => setEditingToolId(null)}
                                />
                            ) : (
                                <>
                                    {/* Main Content */}
                                    <div className="flex items-start justify-between">
                                        {/* Tool Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">

                                                    <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[70%]">
                                                        {/* Name container with max width and wrapping */}
                                                        <div className="font-semibold text-gray-900 text-lg sm:text-xl break-words ">
                                                            {tool.name}
                                                        </div>

                                                        <div className={`text-xs sm:text-sm ${getBadgeColor(tool.type)} px-2 sm:px-3 py-1 rounded-full font-medium flex-shrink-0`}>
                                                            {categoryLabel}
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* Action Buttons - Always visible on mobile */}
                                                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                                    <button
                                                        onClick={() => startEditingTool(tool)}
                                                        className="p-1 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                        title="Editar herramienta"
                                                    >
                                                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeTool(tool.id)}
                                                        className="p-1 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                        title="Eliminar herramienta"
                                                    >
                                                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tool Details */}
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 max-w-full">
                                                {/* Type */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {getToolIcon(tool.type)}
                                                        <div className="text-sm text-gray-700">Tipo:</div>
                                                    </div>
                                                    <div className="text-sm font-medium capitalize text-gray-900 break-words pl-6">
                                                        {tool.type}
                                                    </div>
                                                </div>

                                                {/* Cost */}
                                                {tool.costPerBatch && (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative group">
                                                                <DollarSign className="h-4 w-4 text-green-600 cursor-help tooltip-icon" />
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-pre-line tooltip-content z-10 min-w-[200px] text-left">
                                                                    {getCostExplanation(tool)}
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                            </div>

                                                            <div className="text-sm text-gray-700">Costo adicional:</div>
                                                        </div>
                                                        <div className="text-sm font-bold text-green-700 break-words pl-6">
                                                            ${tool.costPerBatch.toFixed(2)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            {tool.description && (
                                                <div className="mt-3 pt-3 border-t-2 border-gray-400">
                                                    <div className="text-sm sm:text-md text-gray-600">
                                                        {tool.description}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )
                            }
                        </div>
                    )
                })}

                {/* Empty State */}
                {tools.length === 0 && (
                    <div className="text-center py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-xl">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Utensils className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <div className="text-gray-500 text-base sm:text-lg mb-2">No hay herramientas registradas</div>
                        <div className="text-gray-400 text-xs sm:text-sm">Agrega tu primera herramienta usando el formulario de arriba</div>
                    </div>
                )}
            </div>

            {/* Tools Summary Section */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-300 rounded-2xl p-3 sm:p-4 mb-6">
                <h4 className="font-semibold text-blue-800 text-center text-lg sm:text-xl mb-2 sm:mb-3">Resumen de Herramientas</h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                    <div className="bg-white border border-purple-500 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-purple-50 transition-colors"
                        onClick={() => setShowTotalToolsModal(true)}>
                        <div className="text-xs sm:text-sm text-gray-600">Total Herramientas</div>
                        <div className="text-base sm:text-lg font-bold text-purple-700">{tools.length}</div>
                    </div>
                    <div className="bg-white border border-orange-500 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-orange-50 transition-colors"
                        onClick={() => setShowToolsCostModal(true)}>
                        <div className="text-xs sm:text-sm text-gray-600">Costo Total</div>
                        <div className="text-base sm:text-lg font-bold text-orange-700">
                            ${tools.reduce((total, tool) => total + (tool.costPerBatch || 0), 0)
                                .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Tools Count Modal */}
            {
                showTotalToolsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowTotalToolsModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">

                            {/* Header */}
                            <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-purple-800">Todas las Herramientas</h3>
                                            <p className="text-sm text-purple-600">Inventario completo ({tools.length} herramientas)</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowTotalToolsModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-96">
                                <div className="space-y-3">
                                    {tools.map((tool) => {
                                        const categoryLabel = (toolCategories[tool.type as keyof typeof toolCategories] || []).find(cat => cat.value === tool.category)?.label || 'General';

                                        return (
                                            <div key={tool.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900">{tool.name}</div>
                                                    <div className="text-sm text-gray-600 mt-1 capitalize">
                                                        {tool.type} • {categoryLabel}
                                                    </div>
                                                    {tool.description && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {tool.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {tool.costPerBatch && (
                                                        <div className="text-sm font-bold text-purple-700">
                                                            ${tool.costPerBatch.toFixed(2)}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500 capitalize">
                                                        {tool.type}
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
                                    <span className="font-bold text-gray-900">Total de Herramientas:</span>
                                    <span className="text-xl font-bold text-purple-700">{tools.length}</span>
                                </div>
                                <ActionButton
                                    onClick={() => setShowTotalToolsModal(false)}
                                    color="purple"
                                    fullWidth
                                >
                                    Cerrar
                                </ActionButton>
                            </div>
                        </div>
                    </div>)
            }

            {/* Tools Cost Breakdown Modal */}
            {
                showToolsCostModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowToolsCostModal(false)}
                        />
                        <div className="bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl">

                            {/* Header */}
                            <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-orange-800">Costo de Herramientas</h3>
                                            <p className="text-sm text-orange-600">Desglose de inversión en herramientas</p>
                                        </div>
                                    </div>
                                    <CloseButton onClose={() => setShowToolsCostModal(false)} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-96">
                                <div className="space-y-3">
                                    {tools
                                        .filter(tool => tool?.costPerBatch)
                                        .map((tool) => (
                                            <div key={tool.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900">{tool.name}</div>
                                                    <div className="text-sm text-gray-600 mt-1 capitalize">
                                                        {tool.type} • {(toolCategories[tool.type as keyof typeof toolCategories] || []).find(cat => cat.value === tool.category)?.label || 'General'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-orange-700">
                                                        ${tool.costPerBatch && tool.costPerBatch.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        ))
                                    }

                                    {tools.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <DollarSign className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div>No hay herramientas registradas</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-gray-50">
                                <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-lg border">
                                    <span className="font-bold text-gray-900">Costo Total:</span>
                                    <span className="text-xl font-bold text-orange-700">
                                        ${tools.reduce((total, tool) => total + (tool.costPerBatch || 0), 0).toFixed(2)}
                                    </span>
                                </div>
                                <ActionButton
                                    onClick={() => setShowToolsCostModal(false)}
                                    color="red"
                                    fullWidth
                                >
                                    Cerrar
                                </ActionButton>
                            </div>
                        </div>
                    </div>)
            }
        </div >)
}