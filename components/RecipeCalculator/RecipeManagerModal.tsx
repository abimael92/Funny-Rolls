"use client"

import { useState, useEffect } from "react"
import { Recipe, Ingredient, Tool } from "@/lib/types"
import { X, Plus, Trash2, Save, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
// Edit, Eye, ChevronDown, ChevronUp

interface RecipeManagerModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'add' | 'edit' | 'view'
    recipes: Recipe[]
    ingredients: Ingredient[]
    tools: Tool[]
    onRecipeSaved: (recipe: Recipe) => void
    onRecipeDeleted?: (recipeId: string) => void
    initialRecipe?: Recipe
}

export function RecipeManagerModal({
    isOpen,
    onClose,
    mode,
    ingredients,
    tools,
    onRecipeSaved,
    onRecipeDeleted,
    initialRecipe
}: RecipeManagerModalProps) {
    const [activeTab, setActiveTab] = useState<'basic' | 'ingredients' | 'tools' | 'steps'>('basic')
    const [loading, setLoading] = useState(false)
    const [saveType, setSaveType] = useState<'local' | 'database'>('database')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState<Recipe>({
        id: initialRecipe?.id || `recipe-${Date.now()}`,
        name: initialRecipe?.name || '',
        ingredients: initialRecipe?.ingredients || [],
        tools: initialRecipe?.tools || [],
        batchSize: initialRecipe?.batchSize || 12,
        sellingPrice: initialRecipe?.sellingPrice || 50,
        profitMargin: initialRecipe?.profitMargin || 60,
        available: initialRecipe?.available ?? true,
        steps: initialRecipe?.steps || [],
        image: initialRecipe?.image || ''
    })

    // Temp states for adding ingredients/tools
    const [selectedIngredient, setSelectedIngredient] = useState<string>('')
    const [ingredientAmount, setIngredientAmount] = useState<string>('')
    const [selectedTool, setSelectedTool] = useState<string>('')
    const [newStep, setNewStep] = useState<string>('')

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (isOpen && initialRecipe) {
            setFormData(initialRecipe)
        } else if (isOpen && mode === 'add') {
            setFormData({
                id: `recipe-${Date.now()}`,
                name: '',
                ingredients: [],
                tools: [],
                batchSize: 12,
                sellingPrice: 50,
                profitMargin: 60,
                available: true,
                steps: [],
                image: ''
            })
        }
    }, [isOpen, mode, initialRecipe])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // Validation
            if (!formData.name.trim()) {
                throw new Error('Recipe name is required')
            }
            if (formData.ingredients.length === 0) {
                throw new Error('At least one ingredient is required')
            }
            if (formData.batchSize <= 0) {
                throw new Error('Batch size must be greater than 0')
            }

            const recipeToSave = { ...formData }

            if (saveType === 'database') {
                // Save to Supabase
                const { error: supabaseError } = await supabase
                    .from('recipes')
                    .upsert({
                        id: recipeToSave.id,
                        name: recipeToSave.name,
                        batch_size: recipeToSave.batchSize,
                        selling_price: recipeToSave.sellingPrice,
                        profit_margin: recipeToSave.profitMargin,
                        available: recipeToSave.available,
                        ingredients: recipeToSave.ingredients,
                        tools: recipeToSave.tools,
                        steps: recipeToSave.steps,
                        image: recipeToSave.image,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (supabaseError) throw supabaseError
                setSuccess('Recipe saved to database successfully!')
            } else {
                // Save locally only
                setSuccess('Recipe saved locally!')
            }

            // Call parent handler
            onRecipeSaved(recipeToSave)

            // Auto-close after success (optional)
            setTimeout(() => {
                if (mode === 'add') {
                    onClose()
                }
            }, 1500)

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save recipe')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this recipe?')) return

        setLoading(true)
        try {
            if (saveType === 'database') {
                const { error } = await supabase
                    .from('recipes')
                    .delete()
                    .eq('id', formData.id)

                if (error) throw error
            }

            onRecipeDeleted?.(formData.id)
            setSuccess('Recipe deleted successfully')
            setTimeout(() => onClose(), 1000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete recipe')
        } finally {
            setLoading(false)
        }
    }

    const addIngredient = () => {
        if (!selectedIngredient || !ingredientAmount || parseFloat(ingredientAmount) <= 0) return

        const ingredientExists = formData.ingredients.find(
            ing => ing.ingredientId === selectedIngredient
        )

        if (ingredientExists) {
            setError('Ingredient already added')
            return
        }

        setFormData(prev => ({
            ...prev,
            ingredients: [
                ...prev.ingredients,
                {
                    ingredientId: selectedIngredient,
                    amount: parseFloat(ingredientAmount)
                }
            ]
        }))

        setSelectedIngredient('')
        setIngredientAmount('')
    }

    const removeIngredient = (ingredientId: string) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter(ing => ing.ingredientId !== ingredientId)
        }))
    }

    const addTool = () => {
        if (!selectedTool) return

        const toolExists = formData.tools?.find(tool => tool.toolId === selectedTool)

        if (toolExists) {
            setError('Tool already added')
            return
        }

        setFormData(prev => ({
            ...prev,
            tools: [
                ...(prev.tools || []),
                {
                    toolId: selectedTool,
                    usage: 'full'
                }
            ]
        }))

        setSelectedTool('')
    }

    const removeTool = (toolId: string) => {
        setFormData(prev => ({
            ...prev,
            tools: (prev.tools || []).filter(tool => tool.toolId !== toolId)
        }))
    }

    const addStep = () => {
        if (!newStep.trim()) return

        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, newStep.trim()]
        }))

        setNewStep('')
    }

    const removeStep = (index: number) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }))
    }

    const moveStep = (index: number, direction: 'up' | 'down') => {
        const newSteps = [...formData.steps]
        const newIndex = direction === 'up' ? index - 1 : index + 1

        if (newIndex >= 0 && newIndex < newSteps.length) {
            const temp = newSteps[index]
            newSteps[index] = newSteps[newIndex]
            newSteps[newIndex] = temp

            setFormData(prev => ({ ...prev, steps: newSteps }))
        }
    }

    // Calculate cost and profit preview
    const calculatePreview = () => {
        const ingredientCost = formData.ingredients.reduce((total, recipeIng) => {
            const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredientId)
            return total + (ingredient?.price || 0) * recipeIng.amount
        }, 0)

        const toolCost = (formData.tools || []).reduce((total, recipeTool) => {
            const tool = tools.find(t => t.id === recipeTool.toolId)
            return total + (tool?.costPerBatch || 0)
        }, 0)

        const totalCost = ingredientCost + toolCost
        const totalSellingPrice = formData.sellingPrice * formData.batchSize
        const profit = totalSellingPrice - totalCost
        const actualMargin = (profit / totalSellingPrice) * 100

        return { totalCost, totalSellingPrice, profit, actualMargin }
    }

    const preview = calculatePreview()

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: '📝' },
        { id: 'ingredients', label: 'Ingredients', icon: '🥚' },
        { id: 'tools', label: 'Tools', icon: '🔧' },
        { id: 'steps', label: 'Steps', icon: '📋' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-[#F9F3E9] to-[#F5E6D3] px-6 py-4 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#C48A6A]">
                                {mode === 'add' ? 'Add New Recipe' : mode === 'edit' ? 'Edit Recipe' : 'View Recipe'}
                            </h2>
                            <p className="text-sm text-amber-700">
                                {mode === 'view' ? 'View recipe details' : 'Fill in the recipe information below'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 rounded-full transition-colors"
                            disabled={loading}
                        >
                            <X className="h-5 w-5 text-amber-700" />
                        </button>
                    </div>

                    {/* Save Type Toggle */}
                    {mode !== 'view' && (
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-sm font-medium text-amber-800">Save to:</span>
                            <div className="flex bg-white rounded-lg border border-amber-200 p-1">
                                <button
                                    type="button"
                                    onClick={() => setSaveType('local')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${saveType === 'local' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-amber-600 hover:bg-amber-50'}`}
                                >
                                    Local Storage
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSaveType('database')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${saveType === 'database' ? 'bg-[#C48A6A] text-white font-semibold' : 'text-amber-600 hover:bg-amber-50'}`}
                                >
                                    Database
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="sticky top-[120px] z-10 bg-white border-b">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'basic' | 'ingredients' | 'tools' | 'steps')}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-[#C48A6A] text-[#C48A6A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                                {tab.id === 'ingredients' && formData.ingredients.length > 0 && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                        {formData.ingredients.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Messages */}
                        {error && (
                            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-red-700">{error}</span>
                                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-green-700">{success}</span>
                                    <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Basic Info Tab */}
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Recipe Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                                            placeholder="e.g., Classic Cinnamon Rolls"
                                            required
                                            disabled={mode === 'view'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Image URL (optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.image || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent"
                                            placeholder="https://example.com/image.jpg"
                                            disabled={mode === 'view'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Batch Size *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={formData.batchSize}
                                                onChange={(e) => setFormData(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 1 }))}
                                                className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent"
                                                required
                                                disabled={mode === 'view'}
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                units
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Selling Price per Unit *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={formData.sellingPrice}
                                                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                                                className="w-full pl-8 pr-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent"
                                                required
                                                disabled={mode === 'view'}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Target Profit Margin *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={formData.profitMargin}
                                                onChange={(e) => setFormData(prev => ({ ...prev, profitMargin: parseFloat(e.target.value) || 0 }))}
                                                className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent"
                                                required
                                                disabled={mode === 'view'}
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                %
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Availability
                                        </label>
                                        <div className="flex items-center gap-2 p-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, available: true }))}
                                                className={`flex-1 px-4 py-2.5 rounded-lg transition-all ${formData.available ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                disabled={mode === 'view'}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    {formData.available && <Check className="h-4 w-4" />}
                                                    Available
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, available: false }))}
                                                className={`flex-1 px-4 py-2.5 rounded-lg transition-all ${!formData.available ? 'bg-red-100 text-red-800 border-2 border-red-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                disabled={mode === 'view'}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    {!formData.available && <Check className="h-4 w-4" />}
                                                    Unavailable
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Preview */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                                    <h3 className="text-lg font-semibold text-amber-800 mb-3">Cost Preview</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Total Cost per Batch</p>
                                            <p className="text-2xl font-bold text-gray-800">${preview.totalCost.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Total Revenue</p>
                                            <p className="text-2xl font-bold text-green-600">${preview.totalSellingPrice.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Profit per Batch</p>
                                            <p className="text-2xl font-bold text-blue-600">${preview.profit.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Actual Margin</p>
                                            <p className={`text-2xl font-bold ${preview.actualMargin >= formData.profitMargin ? 'text-green-600' : 'text-red-600'}`}>
                                                {preview.actualMargin.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ingredients Tab */}
                        {activeTab === 'ingredients' && (
                            <div className="space-y-6">
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                    <h3 className="font-semibold text-amber-800 mb-3">Add Ingredients</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ingredient
                                            </label>
                                            <select
                                                value={selectedIngredient}
                                                onChange={(e) => setSelectedIngredient(e.target.value)}
                                                className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white"
                                                disabled={mode === 'view'}
                                            >
                                                <option value="">Select ingredient</option>
                                                {ingredients.map(ingredient => (
                                                    <option key={ingredient.id} value={ingredient.id}>
                                                        {ingredient.name} (${ingredient.price}/{ingredient.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Amount
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={ingredientAmount}
                                                    onChange={(e) => setIngredientAmount(e.target.value)}
                                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg"
                                                    placeholder="0.5"
                                                    disabled={mode === 'view'}
                                                />
                                                {selectedIngredient && (
                                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                        {ingredients.find(i => i.id === selectedIngredient)?.unit}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={addIngredient}
                                                className="w-full px-4 py-2 bg-[#C48A6A] text-white rounded-lg hover:bg-[#B37959] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={mode === 'view' || !selectedIngredient || !ingredientAmount}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Ingredient
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Ingredients List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        Recipe Ingredients ({formData.ingredients.length})
                                    </h3>
                                    {formData.ingredients.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            No ingredients added yet
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {formData.ingredients.map((recipeIngredient, index) => {
                                                const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId)
                                                if (!ingredient) return null

                                                const cost = ingredient.price * recipeIngredient.amount

                                                return (
                                                    <div
                                                        key={recipeIngredient.ingredientId}
                                                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-amber-50 transition-colors group"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium text-gray-500 w-6">
                                                                    {index + 1}.
                                                                </span>
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{ingredient.name}</p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {recipeIngredient.amount} {ingredient.unit} • ${cost.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {mode !== 'view' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeIngredient(recipeIngredient.ingredientId)}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tools Tab */}
                        {activeTab === 'tools' && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <h3 className="font-semibold text-blue-800 mb-3">Add Tools & Equipment</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Select Tool
                                            </label>
                                            <select
                                                value={selectedTool}
                                                onChange={(e) => setSelectedTool(e.target.value)}
                                                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white"
                                                disabled={mode === 'view'}
                                            >
                                                <option value="">Select tool</option>
                                                {tools.map(tool => (
                                                    <option key={tool.id} value={tool.id}>
                                                        {tool.name} (${tool.costPerBatch?.toFixed(4)}/batch)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={addTool}
                                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={mode === 'view' || !selectedTool}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Tool
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tools List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        Required Tools ({(formData.tools || []).length})
                                    </h3>
                                    {(formData.tools || []).length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            No tools added yet
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(formData.tools || []).map((recipeTool) => {
                                                const tool = tools.find(t => t.id === recipeTool.toolId)
                                                if (!tool) return null

                                                return (
                                                    <div
                                                        key={recipeTool.toolId}
                                                        className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-800">{tool.name}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    ${tool.costPerBatch?.toFixed(4)} per batch • {tool.type}
                                                                </p>
                                                            </div>
                                                            {mode !== 'view' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTool(recipeTool.toolId)}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Steps Tab */}
                        {activeTab === 'steps' && (
                            <div className="space-y-6">
                                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                    <h3 className="font-semibold text-green-800 mb-3">Add Preparation Step</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newStep}
                                            onChange={(e) => setNewStep(e.target.value)}
                                            className="flex-1 px-4 py-2.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="e.g., Mix flour and sugar in a large bowl"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                                            disabled={mode === 'view'}
                                        />
                                        <button
                                            type="button"
                                            onClick={addStep}
                                            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={mode === 'view' || !newStep.trim()}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Step
                                        </button>
                                    </div>
                                </div>

                                {/* Steps List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        Preparation Steps ({formData.steps.length})
                                    </h3>
                                    {formData.steps.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            No steps added yet
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.steps.map((step, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-green-50 transition-colors group"
                                                >
                                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-800">{step}</p>
                                                    </div>
                                                    {mode !== 'view' && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveStep(index, 'up')}
                                                                disabled={index === 0}
                                                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveStep(index, 'down')}
                                                                disabled={index === formData.steps.length - 1}
                                                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
                                                            >
                                                                ↓
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeStep(index)}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="sticky bottom-0 bg-white pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div>
                                    {mode === 'edit' && onRecipeDeleted && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Recipe
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    {mode !== 'view' && (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2.5 bg-[#C48A6A] text-white rounded-lg hover:bg-[#B37959] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    {mode === 'add' ? 'Create Recipe' : 'Save Changes'}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}