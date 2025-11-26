"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tool } from '@/lib/types'
import { toolCategories } from '@/lib/data'

interface EditableToolRowProps {
    tool: Tool
    onSave: (tool: Tool) => void
    onCancel: () => void
}

export function EditableToolRow({ tool, onSave, onCancel }: EditableToolRowProps) {
    const [editedTool, setEditedTool] = useState<Tool>({ ...tool })

    const handleSave = () => {
        onSave(editedTool)
    }

    return (
        <div className="space-y-3">
            <input
                type="text"
                value={editedTool.name}
                onChange={(e) => setEditedTool({ ...editedTool, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg"
                placeholder="Nombre de la herramienta"
            />

            <div className="grid grid-cols-2 gap-3">
                <select
                    value={editedTool.type}
                    onChange={(e) => {
                        const newType = e.target.value as 'consumible' | 'herramienta' | 'equipo'
                        const defaultCategory = toolCategories[newType]?.[0]?.value || 'measuring'
                        setEditedTool({
                            ...editedTool,
                            type: newType,
                            category: defaultCategory
                        })
                    }}
                    className="px-3 py-2 border-2 border-blue-300 rounded-lg"
                >
                    <option value="consumible">consumible</option>
                    <option value="herramienta">herramientaio</option>
                    <option value="equipo">equipo</option>
                </select>

                <select
                    value={editedTool.category}
                    onChange={(e) => setEditedTool({ ...editedTool, category: e.target.value })}
                    className="px-3 py-2 border-2 border-blue-300 rounded-lg"
                >
                    {toolCategories[editedTool.type as keyof typeof toolCategories]?.map(category => (
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
                value={editedTool.costPerBatch || 0}
                onChange={(e) => setEditedTool({ ...editedTool, costPerBatch: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg"
                placeholder="Costo adicional"
            />

            <textarea
                value={editedTool.description || ''}
                onChange={(e) => setEditedTool({ ...editedTool, description: e.target.value })}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg"
                placeholder="Descripción"
                rows={2}
            />

            <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    Guardar
                </Button>
                <Button onClick={onCancel} variant="outline">
                    Cancelar
                </Button>
            </div>
        </div>
    )
}