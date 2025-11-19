"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Plus, Trash2, Zap, Utensils, Star, DollarSign, Edit } from "lucide-react";
import { Tool } from '@/lib/types';
import { defaultTools, toolCategories } from '@/lib/data';
import { EditableToolRow } from './EditableToolRow';

interface ToolsPanelProps {
    tools: Tool[]
    setTools: (tools: Tool[]) => void
}

export function ToolsPanel({ tools, setTools }: ToolsPanelProps) {
    const [error, setError] = useState<string | null>(null);
    const [showAddSection, setShowAddSection] = useState(false);
    const [editingToolId, setEditingToolId] = useState<string | null>(null)
    const [newTool, setNewTool] = useState<Omit<Tool, 'id'>>({
        name: '',
        type: 'utensil',
        category: 'measuring',
        cost: 0,
        description: ''
    })

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
        setNewTool({
            name: '',
            type: 'utensil',
            category: 'measuring',
            cost: 0,
            description: ''
        })
        setShowAddSection(false)
    }

    // Remove tool
    const removeTool = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta herramienta?')) {
            setTools(tools.filter(tool => tool.id !== id))
        }
    }

    // Add default tool
    // const addDefaultTool = (tool: Tool) => {
    //     setTools([...tools, { ...tool, id: Date.now().toString() }])
    // }

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

    // Get tool color based on type
    const getToolColor = (type: string) => {
        switch (type) {
            case 'utility': return 'bg-blue-50 border-blue-200 hover:border-blue-400'
            case 'utensil': return 'bg-green-50 border-green-200 hover:border-green-400'
            case 'enhancer': return 'bg-purple-50 border-purple-200 hover:border-purple-400'
            default: return 'bg-gray-50 border-gray-200 hover:border-gray-400'
        }
    }

    // Get tool icon based on type
    const getToolIcon = (type: string) => {
        switch (type) {
            case 'utility': return <Zap className="h-4 w-4 text-blue-600" />
            case 'utensil': return <Utensils className="h-4 w-4 text-green-600" />
            case 'enhancer': return <Star className="h-4 w-4 text-purple-600" />
            default: return <Utensils className="h-4 w-4 text-gray-600" />
        }
    }

    // Get badge color based on type
    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'utility': return 'bg-blue-100 text-blue-800'
            case 'utensil': return 'bg-green-100 text-green-800'
            case 'enhancer': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // Filter default tools by what's not already added
    // const availableDefaultTools = defaultTools.filter(defaultTool =>
    //     !tools.some(tool => tool.name === defaultTool.name)
    // )

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
                    <div className="p-4 bg-blue-50 rounded-b-lg border border-blue-300 border-t-0">
                        <h3 className="font-semibold text-lg text-blue-800 text-center mb-4">Agregar Herramienta</h3>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nombre de la herramienta"
                                value={newTool.name}
                                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={newTool.type}
                                    onChange={(e) => {
                                        const newType = e.target.value as 'utility' | 'utensil' | 'enhancer'
                                        const defaultCategory = toolCategories[newType]?.[0]?.value || 'measuring'
                                        setNewTool({
                                            ...newTool,
                                            type: newType,
                                            category: defaultCategory
                                        })
                                    }}
                                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="utility">Utility</option>
                                    <option value="utensil">Utensilio</option>
                                    <option value="enhancer">Enhancer</option>
                                </select>

                                <select
                                    value={newTool.category}
                                    onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {toolCategories[newTool.type]?.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Costo adicional (opcional)"
                                value={newTool.cost === 0 ? '' : newTool.cost}
                                onChange={(e) => setNewTool({ ...newTool, cost: Number(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />

                            <textarea
                                placeholder="Descripción (opcional)"
                                value={newTool.description}
                                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={2}
                            />
                        </div>

                        <Button onClick={addTool} className="w-full bg-blue-600 hover:bg-blue-700 py-3 mt-3">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Herramienta
                        </Button>
                    </div>
                </div>
            </div>

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
                {defaultTools.map((tool) => {
                    const categoryLabel = toolCategories[tool.type]?.find(cat => cat.value === tool.category)?.label || 'General'

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

                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold text-gray-900 text-lg sm:text-xl truncate">{tool.name}</div>
                                                        <div className={`text-xs sm:text-sm ${getBadgeColor(tool.type)} px-2 sm:px-3 py-1 rounded-full font-medium`}>
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
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    {getToolIcon(tool.type)}
                                                    <div className="text-sm sm:text-md text-gray-700">Tipo:</div>
                                                    <div className="text-sm sm:text-md font-medium capitalize text-gray-900">
                                                        {tool.type}
                                                    </div>
                                                </div>

                                                {tool.cost && tool.cost > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-green-600" />
                                                        <div className="text-sm sm:text-md text-gray-700">Costo adicional:</div>
                                                        <div className="text-sm sm:text-md font-bold text-green-700">
                                                            ${tool.cost.toFixed(2)}
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
                            )}
                        </div>
                    )
                })}

                {/* Empty State */}
                {/* {tools.length === 0 && (
                    <div className="text-center py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-xl">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Utensils className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <div className="text-gray-500 text-base sm:text-lg mb-2">No hay herramientas registradas</div>
                        <div className="text-gray-400 text-xs sm:text-sm">Agrega tu primera herramienta usando el formulario de arriba</div>
                    </div>
                )} */}
            </div>

            {/* End of Tools List */}
            {/* Tools Summary Section */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-300 rounded-2xl p-3 sm:p-4 mb-6">
                <h4 className="font-semibold text-blue-800 text-center text-lg sm:text-xl mb-2 sm:mb-3">Resumen de Herramientas</h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                    <div className="bg-white border border-purple-500 rounded-lg p-2 sm:p-3">
                        <div className="text-xs sm:text-sm text-gray-600">Total Herramientas</div>
                        <div className="text-base sm:text-lg font-bold text-purple-700">{defaultTools.length}</div>
                    </div>
                    <div className="bg-white border border-orange-500 rounded-lg p-2 sm:p-3">
                        <div className="text-xs sm:text-sm text-gray-600">Costo Total</div>
                        <div className="text-base sm:text-lg font-bold text-orange-700">
                            ${defaultTools.reduce((total, tool) => total + (tool.cost || 0), 0)
                                .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}