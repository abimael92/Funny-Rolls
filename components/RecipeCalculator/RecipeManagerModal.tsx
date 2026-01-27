"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Recipe, Ingredient, Tool } from "@/lib/types"
import { X, Plus, Trash2, Save, Check, ChevronUp, ChevronDown, FileText, Egg, Wrench, ListChecks } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CustomSelect } from "./CustomSelect"
import { CustomNumberInput } from "./CustomNumberInput"
import { Upload, Camera, Image as ImageIcon } from "lucide-react"
import { uploadFileToS3, deleteFileFromS3, validateImageFile } from "@/lib/aws-s3"

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
    // Image upload states
    const [uploadingImage, setUploadingImage] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(
        initialRecipe?.image || null
    )
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // Form state
    const [formData, setFormData] = useState<Recipe>({
        id: initialRecipe?.id || `recipe-${Date.now()}`,
        name: initialRecipe?.name || '',
        ingredients: initialRecipe?.ingredients || [],
        tools: initialRecipe?.tools || [],
        batchSize: initialRecipe?.batchSize || 10,
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
            // Use Roll Clásico Risueño as template
            const classicRollRecipe = {
                id: `recipe-${Date.now()}`,
                name: '',
                ingredients: [
                    { ingredientId: '1', amount: 1 }, // Harina
                    { ingredientId: '2', amount: 0.3 }, // Azúcar
                    { ingredientId: '3', amount: 0.25 }, // Mantequilla
                    { ingredientId: '4', amount: 0.05 }, // Canela
                    { ingredientId: '5', amount: 0.05 }, // Levadura
                    { ingredientId: '6', amount: 0.5 }, // Huevos
                    { ingredientId: '7', amount: 0.5 }, // Leche
                ],
                tools: [
                    { toolId: 'util-1', usage: 'full' as const }, // Horno
                    { toolId: 'util-3', usage: 'full' as const }, // Mezcladora
                    { toolId: 'uten-1', usage: 'full' as const }, // Juego de Medidores
                    { toolId: 'uten-2', usage: 'full' as const }, // Báscula Digital
                    { toolId: 'uten-3', usage: 'full' as const }, // Bowls Mezcladores
                    { toolId: 'uten-6', usage: 'full' as const }, // Rodillo para Masa
                    { toolId: 'uten-7', usage: 'full' as const }, // Moldes para Hornear
                ],
                batchSize: 10,
                sellingPrice: 50,
                profitMargin: 60,
                available: true,
                steps: [
                    'Mezclar harina, azúcar, levadura y sal en un bowl grande',
                    'Agregar mantequilla derretida y huevos batidos',
                    'Incorporar leche tibia poco a poco mientras se amasa',
                    'Amasar por 10 minutos hasta obtener una masa suave',
                    'Dejar reposar en lugar tibio por 1 hora hasta que duplique su tamaño',
                    'Extender la masa en rectángulo de 40x30 cm',
                    'Espolvorear canela y azúcar uniformemente',
                    'Enrollar firmemente desde el lado largo',
                    'Cortar en 10 porciones iguales',
                    'Colocar en molde engrasado y dejar reposar 30 minutos',
                    'Hornear a 180°C por 25-30 minutos hasta dorar',
                    'Dejar enfriar y decorar con glaseado de crema',
                ],
                image: ''
            }
            setFormData(classicRollRecipe)
        }
    }, [isOpen, mode, initialRecipe])

    useEffect(() => {
        if (initialRecipe?.image) {
            setPreviewImage(initialRecipe.image)
        }
    }, [initialRecipe])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // Validation
            if (!formData.name.trim()) {
                throw new Error('El nombre de la receta es obligatorio')
            }
            if (formData.ingredients.length === 0) {
                throw new Error('Se requiere al menos un ingrediente')
            }
            if (formData.batchSize <= 0) {
                throw new Error('El tamaño del lote debe ser mayor a 0')
            }

            let finalImageUrl = formData.image

            // Upload new image if selected
            if (selectedFile) {
                setUploadingImage(true)
                try {
                    // Delete old image if exists
                    if (initialRecipe?.image && initialRecipe.image.startsWith('https://') && initialRecipe.image !== finalImageUrl) {
                        await deleteFileFromS3(initialRecipe.image)
                    }

                    // Upload new image
                    const uploadedUrl = await uploadFileToS3(selectedFile)
                    finalImageUrl = uploadedUrl
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError)
                    throw new Error('Error al subir la imagen. Por favor intenta de nuevo.')
                } finally {
                    setUploadingImage(false)
                }
            }

            const recipeToSave = {
                ...formData,
                image: finalImageUrl
            }

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
                setSuccess('Receta guardada en la base de datos exitosamente')
            } else {
                setSuccess('Receta guardada localmente')
            }

            // Call parent handler
            onRecipeSaved(recipeToSave)

            // Close modal after success
            setTimeout(() => {
                if (mode === 'add') {
                    onClose()
                }
            }, 1500)

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al guardar la receta')
        } finally {
            setLoading(false)
        }
    }

    // Improved handleDelete: Delete recipe from DB and clean up image if needed
    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) return

        setLoading(true)
        try {
            if (saveType === 'database' && formData.id) {
                // Delete image from S3 if it exists
                if (formData.image && formData.image.startsWith('https://')) {
                    try {
                        await deleteFileFromS3(formData.image)
                    } catch (imageError) {
                        console.error('Error deleting image:', imageError)
                        // Continue with recipe deletion even if image deletion fails
                    }
                }

                // Delete recipe from Supabase
                const { error } = await supabase
                    .from('recipes')
                    .delete()
                    .eq('id', formData.id)

                if (error) throw error
            }

            // Call parent handler to update state
            onRecipeDeleted?.(formData.id)
            setSuccess('Receta eliminada exitosamente')
            setTimeout(() => onClose(), 1000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al eliminar la receta')
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
            setError('El ingrediente ya fue agregado')
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
            setError('La herramienta ya fue agregada')
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

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate the image
        const validation = validateImageFile(file)
        if (!validation.isValid) {
            setError(validation.message || 'Error al validar la imagen')
            return
        }

        setSelectedFile(file)
        setError(null)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewImage(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const removeImage = async () => {
        try {
            // Delete from S3 if there's an existing image URL
            if (initialRecipe?.image && initialRecipe.image.startsWith('https://')) {
                await deleteFileFromS3(initialRecipe.image)
            }
        } catch (err) {
            console.error('Error deleting old image:', err)
            // Don't block user if deletion fails
        }

        setPreviewImage(null)
        setSelectedFile(null)
        setFormData(prev => ({ ...prev, image: '' }))
    }

    // Calcular costo y vista previa de ganancias
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
        { id: 'basic', label: 'Información Básica', icon: <FileText className="h-4 w-4" /> },
        { id: 'ingredients', label: 'Ingredientes', icon: <Egg className="h-4 w-4" /> },
        { id: 'tools', label: 'Herramientas', icon: <Wrench className="h-4 w-4" /> },
        { id: 'steps', label: 'Pasos', icon: <ListChecks className="h-4 w-4" /> },
    ]

    // Options for ingredients select
    const ingredientOptions = ingredients.map(ingredient => ({
        value: ingredient.id,
        label: ingredient.name,
        fullName: `$${ingredient.price}/${ingredient.unit}`
    }))

    // Options for tools select
    const toolOptions = tools.map(tool => ({
        value: tool.id,
        label: tool.name,
        fullName: `$${tool.costPerBatch?.toFixed(4)}/lote`
    }))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-[#F9F3E9] to-[#F5E6D3] px-6 py-4 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#C48A6A]">
                                {mode === 'add' ? 'Agregar Nueva Receta' : mode === 'edit' ? `Editar Receta ${formData.name}` : 'Ver Receta'}
                            </h2>
                            <p className="text-sm text-amber-700">
                                {mode === 'view' ? 'Ver detalles' : 'Completar información'}
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
                            <span className="text-sm font-medium text-amber-800">Guardar en:</span>
                            <div className="flex bg-white rounded-lg border border-amber-200 p-1">
                                <button
                                    type="button"
                                    onClick={() => setSaveType('local')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${saveType === 'local' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-amber-600 hover:bg-amber-50'}`}
                                >
                                    Almacenamiento Local
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSaveType('database')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${saveType === 'database' ? 'bg-[#C48A6A] text-white font-semibold' : 'text-amber-600 hover:bg-amber-50'}`}
                                >
                                    Base de Datos
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
                                className={`flex items-center gap-2 px-4 py-3 text-md font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-[#C48A6A] text-[#C48A6A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.icon}
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
                <div className={`overflow-y-auto max-h-[calc(90vh-180px)] ${activeTab === 'basic' ? 'bg-slate-50' :
                    activeTab === 'ingredients' ? 'bg-amber-50' :
                        activeTab === 'tools' ? 'bg-blue-50' :
                            'bg-green-50' // steps tab
                    }`}>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-20">
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
                                            Nombre de la Receta *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                                            placeholder="Ej: Rollo de Canela Clásico"
                                            required
                                            disabled={mode === 'view'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Imagen de la Receta {uploadingImage && '(Subiendo...)'}
                                        </label>

                                        {/* Image Preview or Upload Area */}
                                        {previewImage || formData.image ? (
                                            <div className="space-y-3">
                                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                                                    <Image
                                                        src={previewImage || formData.image || '/placeholder.svg'}
                                                        alt="Recipe preview"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized={previewImage?.startsWith('blob:') || formData.image?.startsWith('blob:')}
                                                    />
                                                    {mode !== 'view' && (
                                                        <button
                                                            type="button"
                                                            onClick={removeImage}
                                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                            disabled={uploadingImage}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {mode !== 'view' && (
                                                    <div className="text-center">
                                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer">
                                                            <Camera className="h-4 w-4" />
                                                            Cambiar Imagen
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                                disabled={uploadingImage}
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <label className={`block w-full border-2 border-dashed ${mode === 'view' ? 'border-gray-300' : 'border-amber-300 hover:border-amber-400'} rounded-lg p-8 text-center cursor-pointer transition-colors ${mode === 'view' ? 'cursor-default' : ''}`}>
                                                <div className="flex flex-col items-center justify-center">
                                                    {mode === 'view' ? (
                                                        <>
                                                            <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                                                            <span className="text-sm text-gray-600">Sin imagen</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-12 w-12 text-amber-400 mb-3" />
                                                            <span className="text-sm text-gray-600">
                                                                Haz clic para subir una imagen
                                                            </span>
                                                            <span className="text-xs text-gray-500 mt-1">
                                                                PNG, JPG, GIF hasta 5MB
                                                            </span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                                disabled={uploadingImage}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </label>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tamaño del Lote *
                                        </label>
                                        <div className="relative">
                                            <div className="grid grid-cols-12 items-center">
                                                <div className="col-span-10">
                                                    <CustomNumberInput
                                                        value={formData.batchSize}
                                                        onChange={(value) => setFormData(prev => ({ ...prev, batchSize: value }))}
                                                        min={1}
                                                        max={1000}
                                                        placeholder="10"
                                                        allowDecimals={false}
                                                        className="w-full"
                                                        color="amber"
                                                    />
                                                </div>
                                                <div className="col-span-2 pl-2 text-gray-500 text-sm">
                                                    unidades
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Precio de Venta por Unidad *
                                        </label>
                                        <div className="grid grid-cols-12 items-center">
                                            <div className="col-span-1 text-gray-500">$</div>
                                            <div className="col-span-11">
                                                <CustomNumberInput
                                                    value={formData.sellingPrice}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, sellingPrice: value }))}
                                                    min={0.01}
                                                    max={10000}
                                                    placeholder="50.00"
                                                    allowDecimals={true}
                                                    className="w-full"
                                                    color="amber"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Margen de Ganancia Objetivo *
                                        </label>
                                        <div className="relative">
                                            <div className="grid grid-cols-12 items-center">
                                                <div className="col-span-10">
                                                    <CustomNumberInput
                                                        value={formData.profitMargin}
                                                        onChange={(value) => setFormData(prev => ({ ...prev, profitMargin: value }))}
                                                        min={0}
                                                        max={100}
                                                        placeholder="60"
                                                        allowDecimals={true}
                                                        className="w-full"
                                                        color="amber"
                                                    />
                                                </div>
                                                <div className="col-span-2 pl-2 text-gray-500">
                                                    %
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Disponibilidad
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
                                                    Disponible
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
                                                    No Disponible
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Preview */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                                    <h3 className="text-lg font-semibold text-amber-800 mb-3">Vista Previa de Costos</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Costo Total por Lote</p>
                                            <p className="text-2xl font-bold text-gray-800">${preview.totalCost.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Ingresos Totales</p>
                                            <p className="text-2xl font-bold text-green-600">${preview.totalSellingPrice.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Ganancia por Lote</p>
                                            <p className="text-2xl font-bold text-blue-600">${preview.profit.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Margen Real</p>
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
                            <div className="space-y-6 ">
                                <div className="bg-amber-100 rounded-xl p-4 border border-amber-200">
                                    <h3 className="font-semibold text-amber-800 mb-3">Agregar Ingredientes</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ingrediente
                                            </label>
                                            <CustomSelect
                                                value={selectedIngredient}
                                                onChange={setSelectedIngredient}
                                                options={ingredientOptions}
                                                placeholder="Seleccionar ingrediente"
                                                color="amber"
                                                disabled={mode === 'view'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Cantidad
                                            </label>
                                            <div className="relative">
                                                <CustomNumberInput
                                                    value={ingredientAmount ? parseFloat(ingredientAmount) : 0}
                                                    onChange={(value) => setIngredientAmount(value.toString())}
                                                    min={0.01}
                                                    max={1000}
                                                    placeholder="0.5"
                                                    allowDecimals={true}
                                                    className="w-full h-15 shadow-sm border-2 border-amber-200 focus:border-amber-300 focus:ring-4 focus:ring-amber-200 rounded-lg"
                                                    color="amber"
                                                />
                                                {selectedIngredient && (
                                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                        {ingredients.find(i => i.id === selectedIngredient)?.unit}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-end ">
                                            <button
                                                type="button"
                                                onClick={addIngredient}
                                                className="w-full px-4 py-2 rounded-lg bg-[#C48A6A] text-white 
                                                           hover:bg-[#B37959] transition-colors
                                                           focus:ring-2 focus:ring-amber-200 focus:outline-none
                                                           disabled:opacity-50 disabled:cursor-not-allowed
                                                           flex items-center justify-center gap-2"
                                                disabled={mode === 'view' || !selectedIngredient || !ingredientAmount}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agregar
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                {/* Ingredients List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        Ingredientes de la Receta ({formData.ingredients.length})
                                    </h3>
                                    {formData.ingredients.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            No se han agregado ingredientes
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
                                <div className="bg-blue-100 rounded-xl p-4 border border-blue-200">
                                    <h3 className="font-semibold text-blue-800 mb-3">Agregar Herramientas y Equipo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Seleccionar Herramienta
                                            </label>
                                            <CustomSelect
                                                value={selectedTool}
                                                onChange={setSelectedTool}
                                                options={toolOptions}
                                                placeholder="Seleccionar herramienta"
                                                color="blue"
                                                disabled={mode === 'view'}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={addTool}
                                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={mode === 'view' || !selectedTool}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agregar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tools List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        Herramientas Requeridas ({(formData.tools || []).length})
                                    </h3>
                                    {(formData.tools || []).length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            No se han agregado herramientas
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
                                                                    ${tool.costPerBatch?.toFixed(4)} por lote • {tool.type}
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
                                <div className="bg-green-100 rounded-xl p-4 border border-green-200">
                                    <h3 className="font-semibold text-green-800 mb-3">Agregar Paso de Preparación</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newStep}
                                            onChange={(e) => setNewStep(e.target.value)}
                                            className="flex-1 px-4 py-2.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Ej: Mezclar harina y azúcar en un bowl grande"
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
                                            Agregar Paso
                                        </button>
                                    </div>
                                </div>

                                {/* Steps List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        Pasos de Preparación ({formData.steps.length})
                                    </h3>
                                    {formData.steps.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            No se han agregado pasos
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
                                                                <ChevronUp className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveStep(index, 'down')}
                                                                disabled={index === formData.steps.length - 1}
                                                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
                                                            >
                                                                <ChevronDown className="h-4 w-4" />
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
                        <div className="sticky bottom-0 bg-white pt-4 border-t mt-4">
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
                                            Eliminar Receta
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
                                        Cancelar
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
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    {mode === 'add' ? 'Crear Receta' : 'Guardar Cambios'}
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