"use client"

import { useState, useEffect } from "react"
import { products, defaultIngredients, defaultTools } from "@/lib/data";
import { Ingredient, InventoryItem, Recipe, ProductionRecord, Tool } from '@/lib/types';
import { MobileViewSwitcher } from './MobileViewSwitcher'
import { IngredientsPanel } from './IngredientsPanel'
import { RecipeCalculatorPanel } from './RecipeCalculatorPanel'
import { ProductionTrackerPanel } from './ProductionTrackerPanel'

import { RecipeManagerModal } from './RecipeManagerModal'
import { Database, BookOpen, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function RecipeCalculator() {
    // Ingredients management
    const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients);
    const [tools, setTools] = useState<Tool[]>(defaultTools);
    const [recipes, setRecipes] = useState<Recipe[]>(products.map(p => p.recipe))
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0])
    const [mobileView, setMobileView] = useState<'ingredients' | 'calculator' | 'production'>('calculator')
    const [productionHistory, setProductionHistory] = useState<ProductionRecord[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [error, setError] = useState<string | null>(null)
    const [databaseRecipes, setDatabaseRecipes] = useState<Recipe[]>([])
    const [loadingDatabase, setLoadingDatabase] = useState(false)
    const [showDatabaseRecipes, setShowDatabaseRecipes] = useState(false)
    const [recipeModal, setRecipeModal] = useState<{
        isOpen: boolean;
        mode: 'add' | 'edit' | 'view';
        recipe?: Recipe;
    }>({
        isOpen: false,
        mode: 'add'
    })

    // Safe localStorage functions
    const safeSetLocalStorage = (key: string, data: unknown) => {
        try {
            localStorage.setItem(key, JSON.stringify(data))
        } catch (err) {
            console.error(`Failed to save data. \n ${err}`);
            setError('Error al guardar datos. El almacenamiento puede estar lleno.')
        }
    }

    const safeGetLocalStorage = <T,>(key: string, fallback: T): T => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : fallback
        } catch (err) {
            console.error(`Failed to save data. \n ${err}`);
            setError('Error al cargar datos guardados.')
            return fallback
        }
    }

    // Add this function to load recipes from database:
    const loadDatabaseRecipes = async () => {
        setLoadingDatabase(true)
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            const transformedRecipes: Recipe[] = data.map(dbRecipe => ({
                id: dbRecipe.id,
                name: dbRecipe.name,
                ingredients: dbRecipe.ingredients,
                tools: dbRecipe.tools || [],
                batchSize: dbRecipe.batch_size,
                sellingPrice: dbRecipe.selling_price,
                profitMargin: dbRecipe.profit_margin,
                available: dbRecipe.available,
                steps: dbRecipe.steps || [],
                image: dbRecipe.image || ''
            }))

            setDatabaseRecipes(transformedRecipes)
        } catch (err: unknown) {
            console.error('Error loading recipes from database:', err)
            setError(err instanceof Error ? err.message : 'Error al cargar recetas de la base de datos')
        } finally {
            setLoadingDatabase(false)
        }
    }

    // Input validation
    const validateNumber = (value: string, min: number = 0, max: number = 10000): number => {
        const num = parseFloat(value)
        if (isNaN(num)) return min
        if (num < min) return min
        if (num > max) return max
        return Math.round(num * 100) / 100
    }

    // Add this function to handle recipe saved:
    const handleRecipeSaved = (recipe: Recipe) => {
        // Update local recipes
        const existingIndex = recipes.findIndex(r => r.id === recipe.id)

        if (existingIndex >= 0) {
            // Update existing recipe
            const updatedRecipes = [...recipes]
            updatedRecipes[existingIndex] = recipe
            setRecipes(updatedRecipes)

            // Update selected recipe if it's the one being edited
            if (selectedRecipe.id === recipe.id) {
                setSelectedRecipe(recipe)
            }
        } else {
            // Add new recipe
            setRecipes(prev => [...prev, recipe])
        }

        // Reload database recipes
        loadDatabaseRecipes()
    }

    // Add this function to handle recipe deleted:
    const handleRecipeDeleted = (recipeId: string) => {
        // Remove from local recipes
        setRecipes(prev => prev.filter(r => r.id !== recipeId))

        // If deleted recipe was selected, select first recipe
        if (selectedRecipe.id === recipeId && recipes.length > 1) {
            setSelectedRecipe(recipes[0])
        }

        // Reload database recipes
        loadDatabaseRecipes()
    }

    // Load data from localStorage
    useEffect(() => {
        const savedIngredients = safeGetLocalStorage('recipe-calculator-ingredients', defaultIngredients)
        const savedRecipes = safeGetLocalStorage('recipe-calculator-recipes', products.map(p => p.recipe))
        const savedProductionHistory = safeGetLocalStorage('recipe-calculator-production-history', [])
        const savedInventory = safeGetLocalStorage('recipe-calculator-inventory', []);
        const savedTools = safeGetLocalStorage('recipe-calculator-tools', defaultTools);

        setIngredients(savedIngredients);
        setTools(savedTools);

        // FIX: Add missing tools to saved recipes
        const recipesWithTools = savedRecipes.map((savedRecipe: Recipe) => {
            const defaultRecipe = products.find(p => p.recipe.id === savedRecipe.id)?.recipe;

            // If saved recipe doesn't have tools, add them from default
            if (!savedRecipe.tools && defaultRecipe?.tools) {
                return {
                    ...savedRecipe,
                    tools: defaultRecipe.tools,
                    steps: savedRecipe.steps || defaultRecipe?.steps || []
                };
            }

            return {
                ...savedRecipe,
                steps: savedRecipe.steps || []
            };
        });

        setRecipes(recipesWithTools)
        setSelectedRecipe(recipesWithTools[0])

        setProductionHistory(savedProductionHistory)

        if (savedInventory.length > 0) {
            setInventory(savedInventory)
        } else {
            const initialInventory = defaultIngredients.map(ingredient => ({
                ingredientId: ingredient.id,
                currentStock: 0,
                unit: ingredient.unit,
                minimumStock: 0,
                lastUpdated: new Date().toISOString()
            }))
            setInventory(initialInventory)
        }
    }, [])

    // Save to localStorage with error handling
    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-ingredients', ingredients)
    }, [ingredients])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-recipes', recipes)
    }, [recipes])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-production-history', productionHistory)
    }, [productionHistory])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-inventory', inventory)
    }, [inventory]);

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-tools', tools)
    }, [tools])

    useEffect(() => {
        loadDatabaseRecipes()
    }, [])

    // Enhanced record production with validation
    const recordProduction = (recipeId: string, batchCount: number, date: Date = new Date()) => {
        setError(null)

        const validBatchCount = validateNumber(batchCount.toString(), 1, 1000)
        if (validBatchCount <= 0) {
            setError('El número de lotes debe ser al menos 1')
            return
        }

        const recipe = recipes.find(r => r.id === recipeId)
        if (!recipe) {
            setError('La receta no fue encontrada')
            return
        }

        // Check inventory
        const lowStockIngredients: string[] = []
        recipe.ingredients.forEach(recipeIngredient => {
            const inventoryItem = inventory.find(item => item.ingredientId === recipeIngredient.ingredientId)
            const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId)
            const requiredAmount = recipeIngredient.amount * validBatchCount
            if (inventoryItem && inventoryItem.currentStock < requiredAmount && ingredient) {
                lowStockIngredients.push(ingredient.name)
            }
        })

        if (lowStockIngredients.length > 0) {
            setError(`Inventario bajo en: ${lowStockIngredients.join(', ')}`)
            return
        }

        const productionRecord: ProductionRecord = {
            id: Date.now().toString(),
            recipeId,
            recipeName: recipe.name,
            batchCount: validBatchCount,
            date: date.toISOString(),
            totalProduced: validBatchCount * recipe.batchSize
        }

        // Update production history
        setProductionHistory(prev => [productionRecord, ...prev])

        // Update inventory (deduct ingredients used)
        const updatedInventory = [...inventory]
        recipe.ingredients.forEach(recipeIngredient => {
            const inventoryItem = updatedInventory.find(item => item.ingredientId === recipeIngredient.ingredientId)
            if (inventoryItem) {
                const amountUsed = recipeIngredient.amount * validBatchCount
                inventoryItem.currentStock = Math.max(0, inventoryItem.currentStock - amountUsed)
            }
        })
        setInventory(updatedInventory)
    }

    // Function to update inventory manually
    const updateInventory = (ingredientId: string, newStock: number) => {
        const validStock = validateNumber(newStock.toString(), 0, 100000)
        setInventory(prev => prev.map(item =>
            item.ingredientId === ingredientId
                ? { ...item, currentStock: validStock }
                : item
        ))
    }

    // Function to add inventory item
    const addInventoryItem = (ingredientId: string, minimumStock: number = 0) => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId)
        if (!ingredient || inventory.find(item => item.ingredientId === ingredientId)) {
            setError('Ese ingrediente ya está en el inventario o no existe')
            return
        }

        const validMinStock = validateNumber(minimumStock.toString(), 0, 10000)
        const newInventoryItem: InventoryItem = {
            ingredientId,
            currentStock: 0,
            unit: ingredient.unit,
            minimumStock: validMinStock,
            lastUpdated: new Date().toISOString()
        }
        setInventory(prev => [...prev, newInventoryItem])
    }


    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-0">
            {/* Header */}
            <div className="text-center">
                {/* <Calculator className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" /> */}
                <h1 className="font-cursive text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#C48A6A] mb-2 sm:mb-3">
                    Calculadora de Costos
                </h1>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2 sm:px-4">
                    Calcula los costos de tus recetas y optimiza tus ganancias
                </p>
            </div>

            {/* Recipe Management Button Group */}
            <div className="flex justify-center gap-2 sm:gap-3">


                <div className="relative">
                    <button
                        onClick={() => setShowDatabaseRecipes(!showDatabaseRecipes)}
                        className="flex items-center gap-2 px-4 py-2.5  bg-[#C48A6A] text-white rounded-lg hover:bg-[#B37959]  border border-amber-300 transition-all shadow-sm"
                    >
                        <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base font-medium">Gestionar Recetas</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showDatabaseRecipes ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Recipe Management Dropdown */}
                    {showDatabaseRecipes && (
                        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-lg border border-amber-200 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 border-b border-amber-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-amber-800">Recetas</h3>
                                    <button
                                        onClick={loadDatabaseRecipes}
                                        disabled={loadingDatabase}
                                        className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1 hover:bg-amber-50 rounded"
                                    >
                                        {loadingDatabase ? 'Cargando...' : 'Actualizar'}
                                    </button>
                                </div>
                                <div className="flex gap-1 mt-2">
                                    <button
                                        onClick={() => {
                                            setRecipeModal({ isOpen: true, mode: 'add' })
                                            setShowDatabaseRecipes(false)
                                        }}
                                        className="flex-1 text-md px-3 py-1.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                                    >
                                        + Nueva Receta
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto">
                                {/* Database Recipes */}
                                {databaseRecipes.length > 0 && (
                                    <div className="p-2 border-b border-gray-100">
                                        <div className="text-sm font-medium text-gray-500 px-2 py-1">
                                            Recetas en Base de Datos
                                        </div>
                                        {databaseRecipes.map(recipe => (
                                            <button
                                                key={recipe.id}
                                                onClick={() => {
                                                    setRecipeModal({ isOpen: true, mode: 'edit', recipe })
                                                    setShowDatabaseRecipes(false)
                                                }}
                                                className="w-full text-left flex items-center justify-between p-2 hover:bg-amber-50 rounded-lg transition-colors active:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-inset"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <BookOpen className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-gray-900 truncate">
                                                        {recipe.name}
                                                    </span>
                                                    {!recipe.available && (
                                                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0">
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Local Recipes */}
                                <div className="p-2">
                                    <div className="text-sm font-medium text-gray-500 px-2 py-1">
                                        Recetas Locales ({recipes.length})
                                    </div>
                                    {recipes.map(recipe => (
                                        <button
                                            key={recipe.id}
                                            onClick={() => {
                                                setRecipeModal({ isOpen: true, mode: 'edit', recipe })
                                                setShowDatabaseRecipes(false)
                                            }}
                                            className="w-full text-left flex items-center justify-between p-2 hover:bg-amber-50 rounded-lg transition-colors active:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-inset"
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {recipe.name}
                                                </span>
                                                {recipe.id === selectedRecipe.id && (
                                                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded flex-shrink-0">
                                                        Seleccionada
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-b-xl border-t">
                                <button
                                    onClick={() => setShowDatabaseRecipes(false)}
                                    className="text-sm text-gray-600 hover:text-gray-800 w-full text-center"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-2 sm:mx-4 lg:mx-0 rounded-xl border border-red-300 bg-red-50 px-4 py-3 shadow-sm animate-in fade-in duration-150">
                    <div className="flex items-start justify-between gap-3">
                        <span className="text-sm sm:text-base font-medium text-red-700 leading-snug">
                            {error}
                        </span>

                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 hover:text-red-700 transition font-bold text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}


            {/* Mobile View Switcher */}
            <MobileViewSwitcher
                mobileView={mobileView}
                setMobileView={setMobileView}
            />

            {/* Content */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-6 xl:gap-8 space-y-6 lg:space-y-0">
                {/* Ingredients Panel - Hidden on mobile unless selected */}
                <div className={`${mobileView === 'ingredients' ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                    <IngredientsPanel
                        ingredients={ingredients}
                        setIngredients={setIngredients}
                        inventory={inventory}
                        updateInventory={updateInventory}
                        addInventoryItem={addInventoryItem}
                    />
                </div>

                <div className={`${mobileView === 'calculator' ? 'block' : 'hidden'} lg:block lg:col-span-2`}>
                    <RecipeCalculatorPanel
                        selectedRecipe={selectedRecipe}
                        setSelectedRecipe={setSelectedRecipe}
                        recipes={recipes}
                        setRecipes={setRecipes}
                        ingredients={ingredients}
                        tools={tools}
                        recordProduction={recordProduction}
                    />
                </div>

                {/* Production Tracker Panel - Hidden on mobile unless selected */}
                <div className={`${mobileView === 'production' ? 'block' : 'hidden'} lg:block lg:col-span-3`}>
                    <ProductionTrackerPanel
                        productionHistory={productionHistory}
                        inventory={inventory}
                        ingredients={ingredients}
                        recipes={recipes}
                        updateInventory={updateInventory}
                    />
                </div>
            </div>

            {/* Recipe Manager Modal */}
            <RecipeManagerModal
                isOpen={recipeModal.isOpen}
                onClose={() => setRecipeModal({ isOpen: false, mode: 'add' })}
                mode={recipeModal.mode}
                recipes={recipes}
                ingredients={ingredients}
                tools={tools}
                onRecipeSaved={handleRecipeSaved}
                onRecipeDeleted={handleRecipeDeleted}
                initialRecipe={recipeModal.recipe}
            />
        </div>
    )
}