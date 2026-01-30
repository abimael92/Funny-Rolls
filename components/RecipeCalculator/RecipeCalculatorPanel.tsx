'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Download, Upload, Wrench } from 'lucide-react';
import { Calculator } from 'lucide-react';
import { getProducts, getToolCategories } from '@/lib/services';
import { Ingredient, Recipe, Tool, ToolUsage } from '@/lib/types';
import {
    calculateRecipeCost,
    calculateCostPerItem,
    calculateProfit,
    calculateProfitPercentage,
    getIngredientCostPerUnit,
    exportRecipeData,
    importRecipeData,
    calculateTotalToolCost,
    calculateToolCost,
} from '@/lib/utils';
import { FlipCard } from './FlipCard';
import { CloseButton, ActionButton } from './ModalHelpers';
import { UnitConverter } from '@/lib/unit-conversion';
import { CustomNumberInput } from './CustomNumberInput';
import { CustomSelect } from './CustomSelect';
import toast, { Toaster } from 'react-hot-toast';

interface RecipeCalculatorPanelProps {
    selectedRecipe: Recipe;
    setSelectedRecipe: (recipe: Recipe) => void;
    recipes: Recipe[];
    setRecipes: (recipes: Recipe[]) => void;
    ingredients: Ingredient[];
    tools: Tool[];
    recordProduction: (recipeId: string, batchCount: number) => void;
    inventory: Array<{
        ingredientId: string;
        currentStock: number;
        unit: string;
    }>;
}

export function RecipeCalculatorPanel({
    selectedRecipe,
    setSelectedRecipe,
    recipes,
    setRecipes,
    ingredients,
    tools,
    recordProduction,
    inventory = [],
}: RecipeCalculatorPanelProps) {
    const [newStep, setNewStep] = useState('');
    const [isEditingSteps, setIsEditingSteps] = useState(false);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [productionBatchCount, setProductionBatchCount] = useState(1);
    const [showCostModal, setShowCostModal] = useState(false);
    const [showUnitCostModal, setShowUnitCostModal] = useState(false);
    const [showProfitModal, setShowProfitModal] = useState(false);
    const [showMarginModal, setShowMarginModal] = useState(false);
    const [showTotalIngredientsModal, setShowTotalIngredientsModal] =
        useState(false);
    const [showLotesModal, setShowLotesModal] = useState(false);
    const [showProfitGoalModal, setShowProfitGoalModal] = useState(false);
    const [showAddTools, setShowAddTools] = useState(false);
    const [showRecipeTools, setShowRecipeTools] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showAddIngredients, setShowAddIngredients] = useState(true);
    const [showRecipeIngredients, setShowRecipeIngredients] = useState(true);
    const [selectedRecipeTool, setSelectedRecipeTool] = useState<{
        toolId: string;
        toolName: string;
        currentUsage?: ToolUsage;
        currentPercentage?: number;
    } | null>(null);
    const [showToolUsageModal, setShowToolUsageModal] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Replace your entire startDragging function with this:
    const startDragging = (e: React.MouseEvent | React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();

        const handleMove = (clientX: number) => {
            if (!sliderRef.current) return;
            const rect = sliderRef.current.getBoundingClientRect();

            // Calculate horizontal position as 0 to 100% of the bar width
            const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
            let sliderPercent = (x / rect.width) * 100;
            
            if (sliderPercent >= 99.99) {
                sliderPercent = 99.99;
            }

            // Calculate price based on Cost + % of Cost
            const margin = sliderPercent / 100;
            const newPrice = costPerItem / (1 - margin);

            updateRecipeSellingPrice(newPrice);
        };

        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) handleMove(e.touches[0].clientX);
        };

        const onStop = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseup', onStop);
            window.removeEventListener('touchend', onStop);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('mouseup', onStop);
        window.addEventListener('touchend', onStop);

        if ('clientX' in e) handleMove(e.clientX);
        else if (e.touches?.[0]) handleMove(e.touches[0].clientX);
    };

    // Replace your useEffect cleanup with this simpler version:
    useEffect(() => {
        return () => {
            // Clean up any lingering event listeners
            window.removeEventListener('mousemove', () => { });
            window.removeEventListener('mouseup', () => { });
            window.removeEventListener('touchmove', () => { });
            window.removeEventListener('touchend', () => { });
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsMobileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update recipe ingredient amount
    const updateRecipeIngredient = (ingredientId: string, amount: number) => {
        const updatedRecipe = {
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients.map((ri) =>
                ri.ingredientId === ingredientId ? { ...ri, amount: amount || 0 } : ri
            ),
        };
        setSelectedRecipe(updatedRecipe);
        setRecipes(
            recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    };

    // Add ingredient to recipe
    const addIngredientToRecipe = (ingredientId: string) => {
        if (
            !selectedRecipe.ingredients.find((ri) => ri.ingredientId === ingredientId)
        ) {
            const updatedRecipe = {
                ...selectedRecipe,
                ingredients: [
                    ...selectedRecipe.ingredients,
                    { ingredientId, amount: 0.1 },
                ],
            };
            setSelectedRecipe(updatedRecipe);
            setRecipes(
                recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
            );
        }
    };

    // Remove ingredient from recipe
    const removeIngredientFromRecipe = (ingredientId: string) => {
        const updatedRecipe = {
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients.filter(
                (ri) => ri.ingredientId !== ingredientId
            ),
        };
        setSelectedRecipe(updatedRecipe);
        setRecipes(
            recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    };

    // Add tool to recipe
    const addToolToRecipe = (toolId: string) => {
        if (!selectedRecipe.tools?.find((rt) => rt.toolId === toolId)) {
            const updatedRecipe = {
                ...selectedRecipe,
                tools: [
                    ...(selectedRecipe.tools || []),
                    { toolId, usage: 'full' as const },
                ],
            };
            setSelectedRecipe(updatedRecipe);
            setRecipes(
                recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
            );
        }
    };

    // Remove tool from recipe
    const removeToolFromRecipe = (toolId: string) => {
        const updatedRecipe = {
            ...selectedRecipe,
            tools: selectedRecipe.tools?.filter((rt) => rt.toolId !== toolId) || [],
        };
        setSelectedRecipe(updatedRecipe);
        setRecipes(
            recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    };

    // Update recipe selling price
    const updateRecipeSellingPrice = (price: number) => {
        const updatedRecipe = {
            ...selectedRecipe,
            sellingPrice: price,
            profitMargin: calculateProfitPercentage(
                { ...selectedRecipe, sellingPrice: price },
                ingredients
            ),
        };
        setSelectedRecipe(updatedRecipe);
        setRecipes(
            recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    };

    // Update recipe batch size
    const updateRecipeBatchSize = (size: number) => {
        const updatedRecipe = { ...selectedRecipe, batchSize: size };
        setSelectedRecipe(updatedRecipe);
        setRecipes(
            recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    };

    // Add step to recipe
    const addStep = () => {
        if (newStep.trim()) {
            const updatedRecipe = {
                ...selectedRecipe,
                steps: [...selectedRecipe.steps, newStep.trim()],
            };
            setSelectedRecipe(updatedRecipe);
            setRecipes(
                recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
            );
            setNewStep('');
        }
    };

    // Remove step from recipe
    const removeStep = (index: number) => {
        const updatedRecipe = {
            ...selectedRecipe,
            steps: selectedRecipe.steps.filter((_, i) => i !== index),
        };
        setSelectedRecipe(updatedRecipe);
        setRecipes(
            recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    };

    // Update step in recipe
    const updateStep = (index: number, newStepText: string) => {
        const updatedSteps = [...selectedRecipe.steps];
        updatedSteps[index] = newStepText;
        const updatedRecipe = {
            ...selectedRecipe,
            steps: updatedSteps,
        };
        setSelectedRecipe(updatedRecipe);
    };

    // Save steps and exit edit mode
    const saveSteps = () => {
        setRecipes(
            recipes.map((r) => (r.id === selectedRecipe.id ? selectedRecipe : r))
        );
        setIsEditingSteps(false);
    };

    // Backup/Restore functions
    const handleExportData = () => {
        exportRecipeData(ingredients, recipes);
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        importRecipeData(file)
            .then((data) => {
                // This would need to be handled in the parent component
                alert(`Datos importados correctamente! here is your ${data}`);
            })
            .catch((error) => {
                alert(error.message);
            });

        event.target.value = '';
    };

    const handleRecordProduction = () => {
        console.log('--- Starting Stock Check ---');
        console.log('Inventory data:', inventory);
        console.log('Recipe Ingredients:', selectedRecipe.ingredients);

        selectedRecipe.ingredients.forEach((recipeIngredient) => {
            const ingredient = ingredients.find(
                (i) => i.id === recipeIngredient.ingredientId
            );
            const inventoryItem = inventory.find(
                (item) => item.ingredientId === ingredient?.id
            );

            console.log(`${ingredient?.name}:`);
            console.log('  Recipe:', recipeIngredient.amount, ingredient?.unit);
            console.log(
                '  Inventory:',
                inventoryItem?.currentStock,
                inventoryItem?.unit
            );
            console.log('  Units match?', ingredient?.unit === inventoryItem?.unit);
        });

        const validIngredients = selectedRecipe.ingredients.filter(
            (recipeIngredient) => {
                const ingredient = ingredients.find(
                    (i) => i.id === recipeIngredient.ingredientId
                );

                if (!ingredient) {
                    console.warn(
                        `Missing ingredient with ID: ${recipeIngredient.ingredientId} in recipe: ${selectedRecipe.name}`
                    );
                    return false;
                }
                return true;
            }
        );

        // If there are missing ingredients, show a warning
        if (validIngredients.length !== selectedRecipe.ingredients.length) {
            const missingCount =
                selectedRecipe.ingredients.length - validIngredients.length;
            toast(
                <div>
                    <div className='font-semibold'>⚠️ Receta Incompleta</div>
                    <div className='text-sm mt-1'>
                        {missingCount} ingrediente(s) no existen en la base de datos
                    </div>
                </div>,
                {
                    duration: 5000,
                    style: {
                        background: '#fffbeb',
                        color: '#92400e',
                        border: '1px solid #fbbf24',
                    },
                }
            );
        }

        const lowStockNames = validIngredients
            .map((recipeIngredient) => {
                const ingredient = ingredients.find(
                    (i) => i.id === recipeIngredient.ingredientId
                );

                if (!ingredient) return null;

                const inventoryItem = inventory.find(
                    (item) => item.ingredientId === ingredient.id
                );

                if (!inventoryItem) {
                    console.log(`${ingredient.name}: No inventory data found`);
                    return ingredient.name; // No inventory data = assume out of stock
                }

                const currentStock = inventoryItem?.currentStock || 0;

                let totalRequired = 0;

                // Check if units match
                if (ingredient.unit === inventoryItem.unit) {
                    // Same unit, simple multiplication
                    totalRequired = recipeIngredient.amount * productionBatchCount;
                } else {
                    // Need to convert - use UnitConverter
                    try {
                        // Convert recipe amount to inventory unit
                        const convertedAmount = UnitConverter.convert(
                            { value: recipeIngredient.amount, unit: ingredient.unit },
                            inventoryItem.unit
                        );

                        if (convertedAmount) {
                            totalRequired = convertedAmount.value * productionBatchCount;
                        } else {
                            console.warn(
                                `Cannot convert ${recipeIngredient.amount} ${ingredient.unit} to ${inventoryItem.unit} for ${ingredient.name}`
                            );
                            totalRequired = recipeIngredient.amount * productionBatchCount; // Fallback
                        }
                    } catch (error) {
                        console.error(`Conversion error for ${ingredient.name}:`, error);
                        totalRequired = recipeIngredient.amount * productionBatchCount; // Fallback
                    }
                }

                console.log(
                    `${ingredient.name}: Have ${currentStock} ${inventoryItem.unit} | Need ${totalRequired} ${inventoryItem.unit}`
                );

                if (currentStock < totalRequired) {
                    const missingAmount = totalRequired - currentStock;
                    console.log(
                        `Missing: ${missingAmount} ${inventoryItem.unit} of ${ingredient.name}`
                    );
                    return `${ingredient.name} (faltan ${missingAmount.toFixed(2)} ${inventoryItem.unit
                        })`;
                }
                return null;
            })
            .filter((name): name is string => name !== null);

        console.log('Missing Ingredients:', lowStockNames);

        if (lowStockNames.length > 0) {
            toast.custom(
                () => (
                    <div className='bg-red-50 border border-red-300 rounded-lg p-4'>
                        <div className='font-semibold text-red-800'>
                            ⚠️ Stock Insuficiente
                        </div>
                        <div className='text-sm text-red-600 mt-1'>
                            Te falta:
                            {lowStockNames.map((item, index) => (
                                <div key={index}>{item}</div>
                            ))}
                        </div>
                    </div>
                ),
                { duration: 10000 }
            );
            return;
        }

        if (productionBatchCount > 0 && validIngredients.length > 0) {
            setShowConfirmModal(true);
        }
    };

    const updateToolUsage = (
        toolId: string,
        usage: ToolUsage,
        usagePercentage?: number
    ) => {
        const updatedRecipe = {
            ...selectedRecipe,
            tools:
                selectedRecipe.tools?.map((rt) =>
                    rt.toolId === toolId
                        ? {
                            ...rt,
                            usage,
                            usagePercentage:
                                usage === 'partial' ? usagePercentage || 50 : undefined,
                        }
                        : rt
                ) || [],
        };
        setSelectedRecipe(updatedRecipe);
        setRecipes(
            recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    };

    // Calculate costs using utils functions
    const costPerItem = calculateCostPerItem(selectedRecipe, ingredients, tools);
    const totalRecipeCost = calculateRecipeCost(
        selectedRecipe,
        ingredients,
        tools
    );
    const profit = calculateProfit(selectedRecipe, ingredients, tools);
    const profitPercentage = calculateProfitPercentage(
        selectedRecipe,
        ingredients,
        tools
    );

    // Calculate total cost of ONLY ingredients used in this recipe
    const totalRecipeIngredientsCost = selectedRecipe.ingredients.reduce(
        (total, recipeIngredient) => {
            const ingredient = ingredients.find(
                (ing) => ing.id === recipeIngredient.ingredientId
            );
            return ingredient
                ? total + getIngredientCostPerUnit(ingredient) * recipeIngredient.amount
                : total;
        },
        0
    );

    // Calculate batches needed
    const earningsPerLot = selectedRecipe.sellingPrice * selectedRecipe.batchSize;
    const metaLotes = Math.ceil(totalRecipeIngredientsCost / earningsPerLot);

    // Calculate tool costs separately
    const totalToolCost = calculateTotalToolCost(selectedRecipe, tools);

    return (
        <Card className='w-full'>
            <Toaster position='top-right' />
            <CardHeader className='pb-4'>
                <div className='flex items-center justify-center gap-2'>
                    <Calculator className='h-5 w-5 sm:h-6 sm:w-6 text-black-600' />
                    <CardTitle className='text-xl sm:text-2xl text-center'>
                        Calculadora de Receta
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className='space-y-6'>
                {/* Custom Mobile Recipe Dropdown */}
                <div className='space-y-4 lg:hidden'>
                    <div>
                        <label className='block text-lg font-medium mb-2'>
                            Seleccionar Receta
                        </label>
                        {getProducts().filter((p) => p.available).length === 0 ? (
                            <div className='p-4 bg-amber-50 border border-amber-200 rounded text-center'>
                                <p className='text-amber-700'>No hay recetas disponibles</p>
                            </div>
                        ) : (
                            <CustomSelect
                                value={selectedRecipe.id}
                                onChange={(value) => {
                                    const product = getProducts().find((p) => p.recipe.id === value);
                                    if (product) {
                                        setSelectedRecipe(product.recipe);
                                        setIsCardFlipped(false);
                                        setIsEditingSteps(false);
                                    }
                                }}
                                options={getProducts()
                                    .filter((p) => p.available)
                                    .map((p) => ({
                                        value: p.recipe.id,
                                        label: p.recipe.name,
                                    }))}
                                placeholder='Seleccionar receta'
                                color='amber'
                                className='w-full'
                                showFullName={false}
                            />
                        )}
                    </div>

                    {/* Close dropdown when clicking outside (backdrop) */}
                    {isMobileDropdownOpen && (
                        <div
                            className='fixed inset-0 bg-black bg-opacity-10 z-40 lg:hidden'
                            onClick={() => setIsMobileDropdownOpen(false)}
                        />
                    )}
                </div>

                {/* Flip Card - Desktop Only */}
                <div className='hidden lg:block'>
                    <FlipCard
                        selectedRecipe={selectedRecipe}
                        costPerItem={costPerItem}
                        profit={profit}
                        updateRecipeBatchSize={updateRecipeBatchSize}
                        updateRecipeSellingPrice={updateRecipeSellingPrice}
                        isCardFlipped={isCardFlipped}
                        setIsCardFlipped={setIsCardFlipped}
                        isEditingSteps={isEditingSteps}
                        setIsEditingSteps={setIsEditingSteps}
                        newStep={newStep}
                        setNewStep={setNewStep}
                        updateStep={updateStep}
                        removeStep={removeStep}
                        addStep={addStep}
                        saveSteps={saveSteps}
                    />
                </div>

                {/* Mobile Price and Ingredients Section */}
                <div className='lg:hidden space-y-4'>
                    {/* Mobile Recipe Header */}
                    <div className='bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-4'>
                        <div className='flex items-center justify-between mb-3'>
                            <h2 className='font-cursive text-2xl text-blue-800'>
                                {selectedRecipe.name}
                            </h2>
                        </div>

                        {/* Price Section */}
                        <div className='space-y-3'>
                            {/* Batch Size Field */}
                            <div className='flex justify-between items-center py-2 border-b border-blue-200'>
                                <span className='text-lg font-semibold text-blue-700'>
                                    Lote (unidades)
                                </span>
                                <div className='bg-white border-2 border-amber-300 rounded-lg hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200 shadow-sm ml-2 sm:ml-4'>
                                    <CustomNumberInput
                                        value={selectedRecipe.batchSize}
                                        onChange={(value) => {
                                            const clampedValue = Math.max(
                                                1,
                                                Math.min(1000, value || 1)
                                            );
                                            updateRecipeBatchSize(clampedValue);
                                        }}
                                        min={1}
                                        max={1000}
                                        allowDecimals={false}
                                        color='amber'
                                        className='h-full w-full'
                                    />
                                </div>
                            </div>

                            {/* Selling Price Field */}
                            <div className='flex justify-between items-center py-2 border-b border-blue-200'>
                                <span className='text-lg font-semibold text-blue-700'>
                                    Precio de venta
                                </span>
                                <div className='bg-white border-2 border-green-300 rounded-lg hover:border-green-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all duration-200 shadow-sm ml-2 sm:ml-4'>
                                    <CustomNumberInput
                                        value={selectedRecipe.sellingPrice}
                                        onChange={(value) => {
                                            const clampedValue = Math.max(
                                                0,
                                                Math.min(10000, value || 0)
                                            );
                                            updateRecipeSellingPrice(clampedValue);
                                        }}
                                        min={0}
                                        max={10000}
                                        allowDecimals={true} // Allow decimals for price
                                        color='green'
                                        className='h-full w-full'
                                        placeholder='0.00'
                                    />
                                </div>
                            </div>

                            <div className='flex justify-between items-center py-2'>
                                <span className='text-lg font-semibold text-blue-700'>
                                    Costo por unidad
                                </span>
                                <span className='text-xl font-bold text-red-800'>
                                    ${costPerItem.toFixed(2)}
                                </span>
                            </div>

                            <div className='flex justify-between items-center py-2'>
                                <span className='text-lg font-semibold text-blue-700'>
                                    Ganancia
                                </span>
                                <span className='text-xl font-bold text-green-600'>
                                    ${profit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Production Registration */}
                    <div className='bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-4'>
                        <h3 className='text-xl font-bold text-purple-800 mb-4 text-center'>
                            Registrar Producción
                        </h3>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <span className='text-lg font-semibold text-purple-700'>
                                    Lotes producidos
                                </span>

                                <div className='flex items-center bg-white border-2 border-purple-300 rounded-lg p-1 ml-2 sm:ml-4 hover:border-purple-400 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all duration-200 shadow-sm'>
                                    <CustomNumberInput
                                        value={productionBatchCount}
                                        onChange={(value) => setProductionBatchCount(value || 1)}
                                        min={1}
                                        max={10000}
                                        allowDecimals={false}
                                        color='purple'
                                        className='h-full w-full'
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleRecordProduction}
                                className='w-full bg-purple-600 hover:bg-purple-700 text-lg py-3'
                            >
                                <Plus className='h-5 w-5 mr-2' />
                                Registrar Producción
                            </Button>
                            <div className='text-center text-sm text-purple-600'>
                                Total: {productionBatchCount * selectedRecipe.batchSize}{' '}
                                unidades
                            </div>
                        </div>
                    </div>

                    {/* Add Tools Toggle for Mobile */}
                    <div
                        className='bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-2xl p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200 active:scale-95 col-span-2'
                        onClick={() => setShowAddTools(!showAddTools)}
                    >
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                {/* Icon */}
                                <div className='w-10 h-10 bg-white border-2 border-blue-300 rounded-xl flex items-center justify-center shadow-sm'>
                                    <Wrench className='h-5 w-5 text-blue-600' />
                                </div>

                                {/* Text Content */}
                                <div className='text-left'>
                                    <div className='font-semibold text-blue-800 text-base'>
                                        Herramientas
                                    </div>
                                    <div className='flex items-center gap-2 mt-1'>
                                        <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium'>
                                            {selectedRecipe.tools?.length || 0} actuales
                                        </span>
                                        <span className='text-xs text-blue-600'>
                                            {
                                                tools.filter(
                                                    (tool) =>
                                                        !selectedRecipe.tools?.find(
                                                            (rt) => rt.toolId === tool.id
                                                        )
                                                ).length
                                            }{' '}
                                            disponibles
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Chevron and Status */}
                            <div className='flex items-center gap-2'>
                                <div
                                    className={`w-2 h-2 rounded-full ${selectedRecipe.tools && selectedRecipe.tools.length > 0
                                            ? 'bg-green-500'
                                            : 'bg-gray-300'
                                        }`}
                                ></div>
                                <svg
                                    className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${!showAddTools ? 'rotate-180' : ''
                                        }`}
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Quick Preview (when closed) */}
                        {/* {showAddTools && selectedRecipe.tools && selectedRecipe.tools.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex flex-wrap gap-1">
                                {selectedRecipe.tools.slice(0, 3).map((recipeTool) => {
                                    const tool = tools.find(t => t.id === recipeTool.toolId)
                                    return tool ? (
                                        <span key={recipeTool.toolId} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded-full">
                                            {tool.name}
                                        </span>
                                    ) : null
                                })}
                                {selectedRecipe.tools.length > 3 && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        +{selectedRecipe.tools.length - 3} más
                                    </span>
                                )}
                            </div>
                        </div>
                    )} */}
                    </div>

                    {/* Herramientas Section */}
                    {showAddTools && (
                        <div className='col-span-2 space-y-3 mt-2'>
                            {/* Agregar Herramientas */}
                            <div className='bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-4'>
                                <div className='flex items-center justify-between mb-4'>
                                    <h3 className='font-semibold text-blue-800 text-lg flex items-center gap-2'>
                                        <Plus className='h-5 w-5 text-blue-600' />
                                        Agregar Herramientas
                                    </h3>
                                    <div className='text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full'>
                                        {
                                            tools.filter(
                                                (tool) =>
                                                    !selectedRecipe.tools?.find(
                                                        (rt) => rt.toolId === tool.id
                                                    )
                                            ).length
                                        }{' '}
                                        disponibles
                                    </div>
                                </div>

                                <div className='flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2'>
                                    {tools
                                        .filter(
                                            (tool) =>
                                                !selectedRecipe.tools?.find(
                                                    (rt) => rt.toolId === tool.id
                                                )
                                        )
                                        .map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => addToolToRecipe(tool.id)}
                                                className='group bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-400 rounded-lg px-3 py-2 transition-all duration-200 hover:scale-102 active:scale-95 flex items-center gap-2'
                                            >
                                                <Plus className='h-4 w-4 text-blue-600 group-hover:text-blue-700 transition-colors' />
                                                <span className='text-sm font-medium text-blue-800 group-hover:text-blue-900'>
                                                    {tool.name}
                                                </span>
                                                {tool.costPerBatch && tool.costPerBatch > 0 && (
                                                    <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium ml-1'>
                                                        ${tool.costPerBatch.toFixed(2)}
                                                    </span>
                                                )}
                                            </button>
                                        ))}

                                    {tools.filter(
                                        (tool) =>
                                            !selectedRecipe.tools?.find((rt) => rt.toolId === tool.id)
                                    ).length === 0 && (
                                            <div className='w-full text-center py-4'>
                                                <div className='text-green-600 text-base font-medium'>
                                                    Todas las herramientas agregadas
                                                </div>
                                                <div className='text-green-500 text-sm mt-1'>
                                                    No hay herramientas disponibles para agregar
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Herramientas Actuales*/}
                            <div className='bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl p-4'>
                                <h3 className='text-xl font-bold text-indigo-800 mb-4 text-center'>
                                    Herramientas Actuales
                                </h3>

                                <div className='space-y-3 max-h-64 overflow-y-auto'>
                                    {selectedRecipe.tools?.map((recipeTool) => {
                                        const tool = tools.find((t) => t.id === recipeTool.toolId);
                                        if (!tool) return null;

                                        const cost = tool.costPerBatch || 0;

                                        return (
                                            <div
                                                key={recipeTool.toolId}
                                                className='bg-white border-2 border-indigo-200 rounded-xl p-3'
                                            >
                                                {/* Top Row - Name and Cost */}
                                                <div className='flex justify-between items-start mb-2'>
                                                    <span className='text-base font-semibold text-indigo-800 flex-1 pr-2'>
                                                        {tool.name}
                                                    </span>
                                                    {cost > 0 && (
                                                        <span className='text-sm font-bold text-green-600 whitespace-nowrap'>
                                                            ${cost.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Middle Row - Type and Category */}
                                                <div className='flex flex-wrap gap-1 mb-2'>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full font-medium ${tool.type === 'consumible'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : tool.type === 'herramienta'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-purple-100 text-purple-800'
                                                            }`}
                                                    >
                                                        {tool.type}
                                                    </span>
                                                    <span className='text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full'>
                                                        {getToolCategories()[tool.type]?.find(
                                                            (cat) => cat.value === tool.category
                                                        )?.label || 'General'}
                                                    </span>
                                                </div>

                                                {/* Bottom Row - Description and Delete */}
                                                <div className='flex items-center justify-between'>
                                                    {tool.description && (
                                                        <span className='text-xs text-gray-500 flex-1 pr-2 line-clamp-1'>
                                                            {tool.description}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            removeToolFromRecipe(recipeTool.toolId)
                                                        }
                                                        className='p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!selectedRecipe.tools ||
                                        selectedRecipe.tools.length === 0) && (
                                            <div className='text-center py-6'>
                                                <div className='text-indigo-500 text-base mb-1'>
                                                    No hay herramientas
                                                </div>
                                                <div className='text-indigo-400 text-xs'>
                                                    Agrega herramientas arriba
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Agregar Ingredientes*/}
                    <div className='bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4'>
                        <div
                            className={`flex items-center justify-between ${showAddIngredients ? 'mb-4' : ''
                                }`}
                            onClick={() => setShowAddIngredients(!showAddIngredients)}
                        >
                            <h3 className='font-semibold text-amber-800 text-lg flex items-center gap-2'>
                                Agregar Ingredientes
                            </h3>
                            <div className='flex items-center'>
                                <div className='text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full'>
                                    {
                                        ingredients.filter(
                                            (ing) =>
                                                !selectedRecipe.ingredients.find(
                                                    (ri) => ri.ingredientId === ing.id
                                                )
                                        ).length
                                    }{' '}
                                    disponibles
                                </div>
                                <svg
                                    className={`w-5 h-5 text-amber-700 transition-transform duration-300 ${showAddIngredients ? 'rotate-180' : ''
                                        }`}
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            </div>
                        </div>

                        {showAddIngredients && (
                            <div className='flex flex-wrap gap-2'>
                                {ingredients
                                    .filter(
                                        (ing) =>
                                            !selectedRecipe.ingredients.find(
                                                (ri) => ri.ingredientId === ing.id
                                            )
                                    )
                                    .map((ingredient) => (
                                        <button
                                            key={ingredient.id}
                                            onClick={() => addIngredientToRecipe(ingredient.id)}
                                            className='group relative overflow-hidden bg-white hover:bg-amber-50 border border-amber-300 hover:border-amber-400 rounded-lg px-4 py-3 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95'
                                        >
                                            <div className='flex items-center gap-2'>
                                                <Plus className='h-5 w-5 text-amber-600 group-hover:text-amber-700 transition-colors' />
                                                <span className='text-base font-medium text-amber-800 group-hover:text-amber-900'>
                                                    {ingredient.name}
                                                </span>
                                            </div>
                                        </button>
                                    ))}

                                {ingredients.filter(
                                    (ing) =>
                                        !selectedRecipe.ingredients.find(
                                            (ri) => ri.ingredientId === ing.id
                                        )
                                ).length === 0 && (
                                        <div className='w-full text-center py-2'>
                                            <div className='text-amber-600 text-base'>
                                                Todos los ingredientes agregados
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Ingredients Section */}
                    <div className='bg-gradient-to-br from-amber-50 to-cyan-50 border-2 border-amber-300 rounded-2xl p-4'>
                        <h3 className='text-xl font-bold text-amber-800 mb-4 text-center'>
                            Ingredientes
                        </h3>

                        <div className='space-y-3 max-h-96 overflow-y-auto'>
                            {selectedRecipe.ingredients.map((recipeIngredient) => {
                                const ingredient = ingredients.find(
                                    (i) => i.id === recipeIngredient.ingredientId
                                );

                                if (!ingredient) {
                                    console.warn(
                                        `Missing ingredient with ID: ${recipeIngredient.ingredientId} in recipe: ${selectedRecipe.name}`
                                    );
                                    return (
                                        <div
                                            key={recipeIngredient.ingredientId}
                                            className='bg-red-50 border-2 border-red-200 rounded-xl p-3'
                                        >
                                            <div className='flex justify-between items-start mb-2'>
                                                <span className='text-lg font-semibold text-red-800'>
                                                    ⚠️ Ingrediente no encontrado (ID:{' '}
                                                    {recipeIngredient.ingredientId})
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        removeIngredientFromRecipe(
                                                            recipeIngredient.ingredientId
                                                        )
                                                    }
                                                    className='p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg'
                                                >
                                                    <Trash2 className='h-5 w-5' />
                                                </button>
                                            </div>
                                            <div className='text-sm text-red-600'>
                                                Este ingrediente ya no existe en la base de datos
                                            </div>
                                        </div>
                                    );
                                }

                                const cost =
                                    getIngredientCostPerUnit(ingredient) *
                                    recipeIngredient.amount;

                                return (
                                    <div
                                        key={recipeIngredient.ingredientId}
                                        className='bg-white border-2 border-amber-200 rounded-xl p-3'
                                    >
                                        <div className='flex justify-between items-start mb-2'>
                                            <span className='text-lg font-semibold text-amber-800'>
                                                {ingredient.name}
                                            </span>
                                            <span className='text-sm font-bold text-green-600'>
                                                ${cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-2'>
                                                <CustomNumberInput
                                                    value={(() => {
                                                        if (ingredient.unit === 'kg') {
                                                            return recipeIngredient.amount * 1000;
                                                        } else if (
                                                            ingredient.unit === 'l' ||
                                                            ingredient.unit === 'litro'
                                                        ) {
                                                            return recipeIngredient.amount * 1000;
                                                        } else if (ingredient.unit === 'docena') {
                                                            return recipeIngredient.amount * 12;
                                                        } else {
                                                            return recipeIngredient.amount;
                                                        }
                                                    })()}
                                                    onChange={(userInput) => {
                                                        console.log(
                                                            `[MOBILE CHANGE] ${ingredient.name}: User entered ${userInput}`
                                                        );

                                                        let convertedValue = userInput;

                                                        if (ingredient.unit === 'kg') {
                                                            convertedValue = userInput / 1000;
                                                        } else if (
                                                            ingredient.unit === 'l' ||
                                                            ingredient.unit === 'litro'
                                                        ) {
                                                            convertedValue = userInput / 1000;
                                                        } else if (ingredient.unit === 'docena') {
                                                            convertedValue = userInput / 12;
                                                        }

                                                        console.log(
                                                            `[MOBILE CHANGE] Storing: ${convertedValue} ${ingredient.unit}`
                                                        );
                                                        updateRecipeIngredient(
                                                            recipeIngredient.ingredientId,
                                                            convertedValue
                                                        );
                                                    }}
                                                    allowDecimals={true}
                                                    className='w-20 px-2 py-1 border-2 border-amber-300 rounded-lg text-base font-semibold text-center'
                                                    min={0}
                                                    max={10000}
                                                    placeholder='Cantidad'
                                                />

                                                <span className='text-base font-medium text-amber-700'>
                                                    {(() => {
                                                        if (ingredient.unit === 'kg') return 'g';
                                                        if (
                                                            ingredient.unit === 'l' ||
                                                            ingredient.unit === 'litro'
                                                        )
                                                            return 'ml';
                                                        if (ingredient.unit === 'docena') return 'unidades';
                                                        return ingredient.unit;
                                                    })()}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    removeIngredientFromRecipe(
                                                        recipeIngredient.ingredientId
                                                    )
                                                }
                                                className='p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg'
                                            >
                                                <Trash2 className='h-5 w-5' />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile Cost Summary */}
                    <div className='bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4'>
                        <h3 className='text-xl font-bold text-green-800 mb-4 text-center'>
                            Resumen de Costos
                        </h3>

                        <div className='grid grid-cols-2 gap-4 text-center max-h-55 overflow-y-auto pr-2'>
                            <div
                                className='bg-white border-2 border-red-200 rounded-xl p-3 cursor-pointer hover:bg-red-50 transition-colors'
                                onClick={() => setShowUnitCostModal(true)}
                            >
                                <div className='text-sm text-gray-600'>Costo/Unidad</div>
                                <div className='text-lg font-bold text-red-700'>
                                    ${costPerItem.toFixed(2)}
                                </div>
                            </div>

                            {/* <div className="bg-white border-2 border-green-200 rounded-xl p-3 cursor-pointer hover:bg-green-50 transition-colors"
                                onClick={() => setShowProfitModal(true)}>
                                <div className="text-sm text-gray-600">Precio de Venta</div>
                                <div className="text-lg font-bold text-green-700">${(selectedRecipe.sellingPrice)}</div>
                            </div> */}

                            <div
                                className='bg-white border-2 border-green-200 rounded-xl p-3 cursor-pointer hover:bg-green-50 transition-colors'
                                onClick={() => setShowProfitModal(true)}
                            >
                                <div className='text-sm text-gray-600'>Ganancia por Unidad</div>
                                <div className='text-lg font-bold text-green-600'>
                                    ${profit.toFixed(2)}
                                </div>
                            </div>

                            <div
                                className='bg-white border-2 border-blue-200 rounded-xl p-3 cursor-pointer hover:bg-blue-50 transition-colors'
                                onClick={() => setShowMarginModal(true)}
                            >
                                <div className='text-sm text-gray-600'>Margen %</div>
                                <div className='text-lg font-bold text-blue-600'>
                                    {profitPercentage.toFixed(1)}%
                                </div>
                            </div>

                            <div
                                className='bg-white border-2 border-purple-200 rounded-xl p-3 cursor-pointer hover:bg-purple-50 transition-colors'
                                onClick={() => setShowCostModal(true)}
                            >
                                <div className='text-sm text-gray-600'>Costo Total/Lote</div>
                                <div className='text-lg font-bold text-purple-700'>
                                    ${totalRecipeCost.toFixed(2)}
                                </div>
                            </div>

                            {/* <div className="bg-white border-2 border-green-200 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Venta de Lote</div>
                                <div className="text-lg font-bold text-green-700">${(selectedRecipe.sellingPrice * selectedRecipe.batchSize).toFixed(2)}</div>
                            </div> */}

                            <div className='flex flex-col gap-4 p-3 col-span-2'>
                                <div
                                    className='bg-white border-2 border-red-200 rounded-xl p-3 cursor-pointer hover:bg-red-50 transition-colors'
                                    onClick={() => setShowTotalIngredientsModal(true)}
                                >
                                    <div className='text-sm text-gray-600'>
                                        Costo total de Ingredientes
                                    </div>
                                    <div className='text-lg font-bold text-red-700'>
                                        $
                                        {totalRecipeIngredientsCost
                                            .toFixed(2)
                                            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </div>
                                </div>

                                <div
                                    className='bg-white border-2 border-blue-400 rounded-xl p-3 cursor-pointer hover:bg-blue-50 transition-colors'
                                    onClick={() => setShowLotesModal(true)}
                                >
                                    <div className='text-sm text-gray-600'>Meta de Lotes</div>
                                    <div className='text-lg font-bold text-blue-700'>
                                        {metaLotes}
                                    </div>
                                </div>

                                <div className='bg-white border-2 border-purple-400 rounded-xl p-3'>
                                    <div className='text-sm text-gray-600'>
                                        Ganancia Aproximada
                                    </div>
                                    <div className='text-lg font-bold text-purple-700'>
                                        {(
                                            selectedRecipe.sellingPrice *
                                            selectedRecipe.batchSize *
                                            metaLotes -
                                            totalRecipeIngredientsCost
                                        )
                                            .toFixed(2)
                                            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='hidden lg:block space-y-6'>
                    {/* Recipe Selection and Basic Info */}
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-2xl font-medium text-amber-700 mb-2'>
                                Seleccionar Receta
                            </label>

                            {getProducts().filter((p) => p.available).length === 0 ? (
                                <div className='p-4 bg-amber-50 border border-amber-200 rounded text-center'>
                                    <p className='text-amber-700'>No hay recetas disponibles</p>
                                </div>
                            ) : (
                                <CustomSelect
                                    value={selectedRecipe.id}
                                    onChange={(value) => {
                                        const product = getProducts().find((p) => p.recipe.id === value);
                                        if (product) {
                                            setSelectedRecipe(product.recipe);
                                            setIsCardFlipped(false);
                                            setIsEditingSteps(false);
                                        }
                                    }}
                                    options={getProducts()
                                        .filter((product) => product.available)
                                        .map((product) => ({
                                            value: product.recipe.id,
                                            label: product.recipe.name,
                                        }))}
                                    placeholder='Seleccionar receta'
                                    color='amber'
                                    className='w-full'
                                    showFullName={false}
                                />
                            )}
                        </div>
                    </div>
                    {/* Desktop Production Registration */}
                    <div className='bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-4'>
                        <h3 className='text-xl font-bold text-purple-800 mb-4 text-center'>
                            Registrar Producción
                        </h3>
                        <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                                <div className='text-lg font-semibold text-purple-700'>
                                    Lotes producidos hoy
                                </div>
                                <div className='text-sm text-purple-600'>
                                    Total: {productionBatchCount * selectedRecipe.batchSize}{' '}
                                    unidades
                                </div>
                            </div>
                            <div className='flex items-center gap-3'>
                                <div className='flex items-center bg-white border-2 border-purple-300 rounded-lg p-1 ml-2 sm:ml-4 hover:border-purple-400 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all duration-200 shadow-sm'>
                                    <CustomNumberInput
                                        value={productionBatchCount}
                                        onChange={(value) => setProductionBatchCount(value || 1)}
                                        min={1}
                                        max={10000}
                                        allowDecimals={false}
                                        color='purple'
                                        className='h-full w-full'
                                    />
                                </div>
                                <Button
                                    onClick={handleRecordProduction}
                                    className='bg-purple-600 hover:bg-purple-700 text-lg py-2'
                                >
                                    <Plus className='h-5 w-5 mr-2' />
                                    Registrar
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* Add Tools */} {/* Desktop */}
                    <div className='bg-linear-to-br from-blue-100 to-cyan-50 border border-blue-200 rounded-xl p-4'>
                        <div
                            className={`flex items-center justify-between ${showAddTools ? 'mb-4' : ''
                                }`}
                            onClick={() => setShowAddTools(!showAddTools)}
                        >
                            <h3 className='font-semibold text-blue-800 text-lg flex items-center gap-2'>
                                <svg
                                    className='w-5 h-5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                                    />
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                    />
                                </svg>
                                Agregar Herramientas
                            </h3>
                            <div className='flex items-center gap-2'>
                                <div className='text-sm text-blue-700 bg-blue-200/60 px-3 py-1 rounded-full'>
                                    {
                                        tools.filter(
                                            (tool) =>
                                                !selectedRecipe.tools?.find(
                                                    (rt) => rt.toolId === tool.id
                                                )
                                        ).length
                                    }{' '}
                                    disponibles
                                </div>

                                {/* CHEVRON */}
                                <svg
                                    className={`w-5 h-5 text-blue-700 transition-transform duration-300 ${!showAddTools ? 'rotate-180' : ''
                                        }`}
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            </div>
                        </div>

                        {showAddTools && (
                            <div className='flex flex-wrap gap-2'>
                                {tools
                                    .filter(
                                        (tool) =>
                                            !selectedRecipe.tools?.find((rt) => rt.toolId === tool.id)
                                    )
                                    .map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => addToolToRecipe(tool.id)}
                                            className='group relative overflow-hidden bg-white hover:bg-green-50 border border-blue-300 hover:border-blue-400 rounded-lg px-4 py-3 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95'
                                        >
                                            <div className='flex items-center gap-2'>
                                                <Plus className='h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors' />
                                                <span className='text-base font-medium text-blue-800 group-hover:text-blue-900'>
                                                    {tool.name}
                                                </span>
                                                {tool.costPerBatch && tool.costPerBatch > 0 && (
                                                    <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>
                                                        ${tool.costPerBatch.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}

                                {tools.filter(
                                    (tool) =>
                                        !selectedRecipe.tools?.find((rt) => rt.toolId === tool.id)
                                ).length === 0 && (
                                        <div className='w-full text-center py-2'>
                                            <div className='text-green-600 text-base'>
                                                Todas las herramientas agregadas
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                    {/* Recipe Tools */} {/* Desktop */}
                    <div
                        className={`bg-linear-to-br from-blue-100 to-cyan-50 border border-blue-200 rounded-xl p-4
                            }`}
                    >
                        <div
                            className={`flex items-center justify-between ${showRecipeTools ? 'mb-4 ' : ''
                                }`}
                            onClick={() => setShowRecipeTools(!showRecipeTools)}
                        >
                            <div>
                                <h3 className='font-semibold text-blue-800 text-lg flex items-center gap-2'>
                                    <Wrench className='h-4 w-4' />
                                    Herramientas de la Receta
                                </h3>
                                <div className='text-xs text-blue-600'>
                                    Costo: ${totalToolCost.toFixed(2)}
                                </div>
                            </div>
                            <div className='flex items-center gap-2'>
                                <div className='text-sm text-blue-700 bg-blue-200/60 px-3 py-1 rounded-full'>
                                    {selectedRecipe.tools?.length || 0} herramientas
                                </div>

                                {/* CHEVRON */}
                                <svg
                                    className={`w-5 h-5 text-blue-700 transition-transform duration-300 ${!showRecipeTools ? 'rotate-180' : ''
                                        }`}
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            </div>
                        </div>

                        {showRecipeTools && (
                            <div className='space-y-3 max-h-80 overflow-y-auto pr-2'>
                                {selectedRecipe.tools?.map((recipeTool) => {
                                    const tool = tools.find((t) => t.id === recipeTool.toolId);
                                    if (!tool) return null;

                                    const cost = tool.costPerBatch || 0;
                                    const costPercentage = (cost / totalRecipeCost) * 100;

                                    return (
                                        <div
                                            key={recipeTool.toolId}
                                            className='group relative bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md'
                                        >
                                            {/* Cost percentage bar */}
                                            <div
                                                className='absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-t-xl'
                                                style={{ width: `${Math.min(costPercentage, 100)}%` }}
                                            ></div>

                                            <div className='flex items-center justify-between'>
                                                {/* Tool Info */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-3 mb-2'>
                                                        <div className='font-semibold text-gray-900 text-lg'>
                                                            {tool.name}
                                                        </div>
                                                        <div
                                                            className={`text-xs px-2 py-1 rounded-full font-medium ${tool.type === 'consumible'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : tool.type === 'herramienta'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-purple-100 text-purple-800'
                                                                }`}
                                                        >
                                                            {tool.type}
                                                        </div>
                                                    </div>

                                                    {/* Tool Details */}
                                                    <div className='flex items-center justify-between gap-4'>
                                                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                                                            <span>
                                                                {getToolCategories()[tool.type]?.find(
                                                                    (cat) => cat.value === tool.category
                                                                )?.label || 'General'}
                                                            </span>
                                                            {tool.description && (
                                                                <span className='text-xs text-gray-500'>
                                                                    • {tool.description}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Cost Display */}
                                                        {cost > 0 && (
                                                            <div className='text-lg font-bold text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-2 min-w-[80px] text-center shadow-sm'>
                                                                ${cost.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Settings Button */}
                                                {/* <button
                                                    onClick={() => {
                                                        const recipeTool = selectedRecipe.tools?.find(rt => rt.toolId === tool.id);
                                                        setSelectedRecipeTool({
                                                            toolId: tool.id,
                                                            toolName: tool.name,
                                                            currentUsage: recipeTool?.usage,
                                                            currentPercentage: recipeTool?.usagePercentage
                                                        });
                                                        setShowToolUsageModal(true);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                    title="Configurar uso"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button> */}

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() =>
                                                        removeToolFromRecipe(recipeTool.toolId)
                                                    }
                                                    className='opacity-0 group-hover:opacity-100 ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95'
                                                    title='Eliminar herramienta'
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </button>
                                            </div>

                                            {/* Cost percentage indicator */}
                                            {cost > 0 && (
                                                <div className='mt-2 flex items-center justify-between text-xs'>
                                                    <span className='text-gray-500'>
                                                        Porcentaje del costo total:
                                                    </span>
                                                    <span className='font-medium text-blue-700'>
                                                        {costPercentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {(!selectedRecipe.tools ||
                                    selectedRecipe.tools.length === 0) && (
                                        <div className='text-center py-8'>
                                            <div className='text-blue-500 text-sm mb-2'>
                                                No hay herramientas en esta receta
                                            </div>
                                            <div className='text-blue-400 text-xs'>
                                                Agrega herramientas usando la sección de arriba
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                    {/* Add Ingredients */} {/* Desktop */}
                    <div className='bg-linear-to-br from-amber-100 to-amber-50 border  border-amber-200 rounded-xl p-4'>
                        <div
                            className={`flex items-center justify-between ${showAddIngredients ? 'mb-4' : ''
                                }`}
                            onClick={() => setShowAddIngredients(!showAddIngredients)}
                        >
                            <h3 className='font-semibold text-amber-800 text-lg flex items-center gap-2'>
                                Agregar Ingredientes
                            </h3>
                            <div className='flex items-center gap-2'>
                                <div className='text-sm text-amber-700 bg-amber-200/60 px-3 py-1 rounded-full'>
                                    {
                                        ingredients.filter(
                                            (ing) =>
                                                !selectedRecipe.ingredients.find(
                                                    (ri) => ri.ingredientId === ing.id
                                                )
                                        ).length
                                    }{' '}
                                    disponibles
                                </div>
                                <svg
                                    className={`w-5 h-5 text-amber-700 transition-transform duration-300 ${!showAddIngredients ? 'rotate-180' : ''
                                        }`}
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            </div>
                        </div>

                        {showAddIngredients && (
                            <div className='flex flex-wrap gap-2'>
                                {ingredients
                                    .filter(
                                        (ing) =>
                                            !selectedRecipe.ingredients.find(
                                                (ri) => ri.ingredientId === ing.id
                                            )
                                    )
                                    .map((ingredient) => (
                                        <button
                                            key={ingredient.id}
                                            onClick={() => addIngredientToRecipe(ingredient.id)}
                                            className='group relative overflow-hidden bg-white hover:bg-green-50 border border-amber-300 hover:border-amber-400 rounded-lg px-4 py-3 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95'
                                        >
                                            <div className='flex items-center gap-2'>
                                                <Plus className='h-5 w-5 text-amber-600 group-hover:text-amber-700 transition-colors' />
                                                <span className='text-base font-medium text-amber-800 group-hover:text-amber-900'>
                                                    {ingredient.name}
                                                </span>
                                            </div>
                                        </button>
                                    ))}

                                {ingredients.filter(
                                    (ing) =>
                                        !selectedRecipe.ingredients.find(
                                            (ri) => ri.ingredientId === ing.id
                                        )
                                ).length === 0 && (
                                        <div className='w-full text-center py-2'>
                                            <div className='text-green-600 text-base'>
                                                Todos los ingredientes agregados
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                    {/* Recipe Ingredients */} {/* Desktop */}
                    <div className='bg-linear-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl p-4'>
                        <div
                            className={`flex items-center justify-between ${showRecipeIngredients ? 'mb-4' : ''
                                }`}
                            onClick={() => setShowRecipeIngredients(!showRecipeIngredients)}
                        >
                            <h3 className='font-semibold text-amber-800 text-lg flex items-center gap-2'>
                                Ingredientes de la Receta
                            </h3>
                            <div className='flex items-center gap-2'>
                                <div className='text-sm text-amber-700 bg-amber-200/60 px-2 py-1 rounded-full font-normal'>
                                    {selectedRecipe.ingredients.length} ingredientes
                                </div>
                                <svg
                                    className={`w-5 h-5 text-amber-700 transition-transform duration-300 ${!showRecipeIngredients ? 'rotate-180' : ''
                                        }`}
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            </div>
                        </div>

                        {showRecipeIngredients && (
                            <div className='space-y-3 max-h-80 overflow-y-auto pr-2'>
                                {selectedRecipe.ingredients.map((recipeIngredient) => {
                                    const ingredient = ingredients.find(
                                        (i) => i.id === recipeIngredient.ingredientId
                                    );
                                    // console.log('ingredient', ingredient);

                                    if (!ingredient) return null;

                                    const isNonStandardUnit = [
                                        'botella',
                                        'bolsa',
                                        'docena',
                                        'paquete',
                                        'sobre',
                                        'caja',
                                        'latas',
                                    ].includes(ingredient.unit);

                                    const cost =
                                        getIngredientCostPerUnit(ingredient) *
                                        recipeIngredient.amount;
                                    const convertedUnit = UnitConverter.convertToStandardUnit(
                                        1,
                                        ingredient.unit
                                    );
                                    const costPercentage = (cost / totalRecipeCost) * 100;

                                    return (
                                        <div
                                            key={recipeIngredient.ingredientId}
                                            className='group relative bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md'
                                        >
                                            {/* Cost percentage bar */}
                                            <div
                                                className='absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-xl'
                                                style={{ width: `${Math.min(costPercentage, 100)}%` }}
                                            ></div>

                                            <div className='flex items-center justify-between'>
                                                {/* Ingredient Info */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-3 mb-2'>
                                                        <div className='font-semibold text-gray-900 text-lg'>
                                                            {ingredient.name}
                                                        </div>

                                                        <div className='text-md text-amber-600 bg-amber-100 px-2 py-1 rounded-full'>
                                                            {isNonStandardUnit ? (
                                                                <span className='line-through text-amber-400/50'>
                                                                    ${ingredient.price.toFixed(2)} •{' '}
                                                                    {ingredient.amount} {ingredient.unit}
                                                                </span>
                                                            ) : (
                                                                `$${ingredient.price.toFixed(2)} • ${ingredient.amount
                                                                } ${ingredient.unit}`
                                                            )}
                                                        </div>

                                                        {isNonStandardUnit && (
                                                            <div className='text-md text-amber-600 bg-amber-100 px-2 py-1 rounded-full'>
                                                                $
                                                                {getIngredientCostPerUnit(ingredient).toFixed(
                                                                    2
                                                                )}{' '}
                                                                • {ingredient.containsAmount}{' '}
                                                                {convertedUnit?.unit || ingredient.unit}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Amount Input */}
                                                    <div className='flex justify-between items-center gap-2 w-full'>
                                                        {/* Amount + Unit */}
                                                        <div className='flex items-center gap-0.5 bg-white border-2 border-amber-300 rounded-lg px-3 py-2 min-w-[140px] hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all duration-200'>
                                                            <CustomNumberInput
                                                                className='w-20 bg-transparent border-none text-md font-bold text-amber-900 focus:outline-none focus:ring-0'
                                                                value={(() => {
                                                                    // Direct conversion logic here
                                                                    if (ingredient.unit === 'kg') {
                                                                        // Convert kg to grams for display
                                                                        const grams =
                                                                            recipeIngredient.amount * 1000;
                                                                        // console.log(`[DISPLAY] ${ingredient.name}: ${recipeIngredient.amount}kg = ${grams}g`);
                                                                        return grams;
                                                                    } else if (
                                                                        ingredient.unit === 'l' ||
                                                                        ingredient.unit === 'litro'
                                                                    ) {
                                                                        // Convert liters to ml for display
                                                                        const ml = recipeIngredient.amount * 1000;
                                                                        // console.log(`[DISPLAY] ${ingredient.name}: ${recipeIngredient.amount}l = ${ml}ml`);
                                                                        return ml;
                                                                    } else if (ingredient.unit === 'docena') {
                                                                        // Convert docena to units for display
                                                                        const units = recipeIngredient.amount * 12;
                                                                        // console.log(`[DISPLAY] ${ingredient.name}: ${recipeIngredient.amount}docena = ${units}unidades`);
                                                                        return units;
                                                                    } else {
                                                                        // For other units, use as-is
                                                                        // console.log(`[DISPLAY] ${ingredient.name}: ${recipeIngredient.amount}${ingredient.unit}`);
                                                                        return recipeIngredient.amount;
                                                                    }
                                                                })()}
                                                                onChange={(userInput) => {
                                                                    console.log(
                                                                        `[CHANGE] ${ingredient.name}: User entered ${userInput}`
                                                                    );

                                                                    let convertedValue = userInput;

                                                                    // Convert back to storage unit
                                                                    if (ingredient.unit === 'kg') {
                                                                        convertedValue = userInput / 1000; // grams to kg
                                                                        console.log(
                                                                            `[CHANGE] Converting ${userInput}g to ${convertedValue}kg`
                                                                        );
                                                                    } else if (
                                                                        ingredient.unit === 'l' ||
                                                                        ingredient.unit === 'litro'
                                                                    ) {
                                                                        convertedValue = userInput / 1000; // ml to liters
                                                                        console.log(
                                                                            `[CHANGE] Converting ${userInput}ml to ${convertedValue}l`
                                                                        );
                                                                    } else if (ingredient.unit === 'docena') {
                                                                        convertedValue = userInput / 12; // units to docena
                                                                        console.log(
                                                                            `[CHANGE] Converting ${userInput} unidades to ${convertedValue} docena`
                                                                        );
                                                                    }

                                                                    console.log(
                                                                        `[CHANGE] Final storage value: ${convertedValue} ${ingredient.unit}`
                                                                    );
                                                                    updateRecipeIngredient(
                                                                        recipeIngredient.ingredientId,
                                                                        convertedValue
                                                                    );
                                                                }}
                                                                allowDecimals={true}
                                                                min={0}
                                                                max={10000}
                                                                placeholder='Cantidad'
                                                            />

                                                            <span className='text-md text-amber-700 font-semibold'>
                                                                {(() => {
                                                                    // Display unit based on storage unit
                                                                    if (ingredient.unit === 'kg') return 'g';
                                                                    if (
                                                                        ingredient.unit === 'l' ||
                                                                        ingredient.unit === 'litro'
                                                                    )
                                                                        return 'ml';
                                                                    if (ingredient.unit === 'docena')
                                                                        return 'unidades';
                                                                    return ingredient.unit;
                                                                })()}
                                                            </span>
                                                        </div>

                                                        {/* Cost Display */}
                                                        <div className='text-lg font-bold text-amber-700 bg-amber-50 border-2 border-amber-200 rounded-lg px-4 py-2 min-w-[80px] text-center shadow-sm'>
                                                            ${cost.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() =>
                                                        removeIngredientFromRecipe(
                                                            recipeIngredient.ingredientId
                                                        )
                                                    }
                                                    className='opacity-0 group-hover:opacity-100 ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95'
                                                    title='Eliminar ingrediente'
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </button>
                                            </div>

                                            {/* Cost percentage indicator */}
                                            <div className='mt-2 flex justify-end items-center gap-2 text-xs'>
                                                <span className='text-amber-950'>
                                                    Porcentaje del costo total:
                                                </span>
                                                <span className='font-medium text-amber-700'>
                                                    {costPercentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {selectedRecipe.ingredients.length === 0 && (
                                    <div className='text-center py-8'>
                                        <div className='text-amber-500 text-sm mb-2'>
                                            No hay ingredientes en esta receta
                                        </div>
                                        <div className='text-amber-400 text-xs'>
                                            Agrega ingredientes usando la sección de arriba
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Quick Stats */}
                    {/* <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <div
                                className="bg-white border-2 border-red-200 rounded-xl p-3 text-center cursor-pointer hover:bg-red-50 transition-colors"
                                onClick={() => setShowUnitCostModal(true)}
                            >
                                <div className="text-sm text-gray-600">Costo/Unidad</div>
                                <div className="text-lg font-bold text-red-700">${costPerItem.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-green-200 rounded-xl p-3 text-center cursor-pointer hover:bg-green-50 transition-colors"
                                onClick={() => setShowProfitModal(true)}>
                                <div className="text-sm text-gray-600">Ganancia/Unidad</div>
                                <div className="text-lg font-bold text-green-600">${profit.toFixed(2)}</div>
                            </div>

                            <div className="bg-white border-2 border-blue-200 rounded-xl p-3 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                                onClick={() => setShowMarginModal(true)}>
                                <div className="text-sm text-gray-600">Margen %</div>
                                <div className="text-lg font-bold text-blue-600">{profitPercentage.toFixed(1)}%</div>
                            </div>*/}
                    {/* Clickable Cost Card */}
                    {/*
                           <div
                                className="bg-white border-2 border-purple-200 rounded-xl p-3 text-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                                onClick={() => setShowCostModal(true)}
                            >
                                <div className="text-sm text-gray-600">Costo Total</div>
                                <div className="text-lg font-bold text-purple-700">${totalRecipeCost.toFixed(2)}</div>
                            </div>
                        </div>
                    </div> */}
                    {/* Cost Summary */}
                    <Card className='bg-amber-50 border-amber-200'>
                        <CardContent className='p-4'>
                            <h3 className='font-semibold mb-3 text-amber-800 text-2xl text-center'>
                                Resumen de Costos
                            </h3>
                            <div className='grid grid-cols-2 gap-4 text-sm'>
                                <div className='text-center'>
                                    <div
                                        className='bg-white border-2 border-purple-200 rounded-xl p-3 text-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200'
                                        onClick={() => setShowCostModal(true)}
                                    >
                                        <div className='text-sm text-gray-600'>Costo Total</div>
                                        <div className='text-lg font-bold text-purple-700'>
                                            ${totalRecipeCost.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className='text-center'>
                                    <div
                                        className='bg-white border-2 border-red-200 rounded-xl p-3 cursor-pointer hover:bg-red-50 transition-colors'
                                        onClick={() => setShowUnitCostModal(true)}
                                    >
                                        <div className='text-sm text-gray-600'>Costo/Unidad</div>
                                        <div className='text-lg font-bold text-red-700'>
                                            ${costPerItem.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className='text-center'>
                                    <div
                                        className='bg-white border-2 border-green-200 rounded-xl p-3 text-center cursor-pointer hover:bg-green-50 transition-colors'
                                        onClick={() => setShowProfitModal(true)}
                                    >
                                        <div className='text-sm text-gray-600'>Ganancia/Unidad</div>
                                        <div className='text-lg font-bold text-green-600'>
                                            ${profit.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className='text-center'>
                                    <div
                                        className='bg-white border-2 border-blue-200 rounded-xl p-3 text-center cursor-pointer hover:bg-blue-50 transition-colors'
                                        onClick={() => setShowMarginModal(true)}
                                    >
                                        <div className='text-sm text-gray-600'>Margen %</div>
                                        <div className='text-lg font-bold text-blue-600'>
                                            {profitPercentage.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profitability Indicator */}
                            {/* ALWAYS HERE!!!! */}
                            {/* Profitability Indicator */}
                            {(() => {
                                // This ensures the visual handle maps 0% to the start and 100% to the end
                                const actualMargin =
                                    ((selectedRecipe.sellingPrice - costPerItem) /
                                        selectedRecipe.sellingPrice) *
                                    100;
                                const visualPercent = Math.min(Math.max(actualMargin, 0), 100);

                                return (
                                    <div className='mt-8 relative'>
                                        <div className='flex justify-between items-center mb-6'>
                                            <div>
                                                <div className='text-lg font-bold text-gray-800'>
                                                    Rentabilidad:
                                                </div>
                                            </div>
                                            <div
                                                className={`px-4 py-2 rounded-full font-medium ${visualPercent >= 50
                                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                                        : visualPercent >= 30
                                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                                            : 'bg-red-100 text-red-800 border border-red-300'
                                                    }`}
                                            >
                                                {visualPercent >= 50
                                                    ? 'Excelente'
                                                    : visualPercent >= 30
                                                        ? 'Buena'
                                                        : 'Baja'}
                                            </div>
                                        </div>

                                        <div className='relative h-10'>
                                            <div
                                                ref={sliderRef}
                                                className='absolute inset-x-0 top-1/2 h-4 -translate-y-1/2  w-full bg-gray-200 rounded-full'
                                            >
                                                {/* Colored progress bar */}
                                                <div
                                                    className='absolute top-0 left-0 h-full rounded-full bg-linear-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-75'
                                                    style={{ width: `${visualPercent}%` }}
                                                ></div>

                                                {/* Handle and Tooltip */}
                                                <div
                                                    style={{ left: `${visualPercent}%` }}
                                                    className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 z-10 cursor-grab active:cursor-grabbing touch-none'
                                                    onMouseDown={startDragging}
                                                    onTouchStart={startDragging}
                                                >
                                                    <div className='absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-xl text-center min-w-[110px]'>
                                                        <div className='text-lg font-bold'>
                                                            ${selectedRecipe.sellingPrice.toFixed(2)}
                                                        </div>
                                                        <div className='text-[10px] text-gray-400'>
                                                            {visualPercent.toFixed(0)}% margen
                                                        </div>
                                                        <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45'></div>
                                                    </div>

                                                    <div className='w-10 h-10 bg-white border-4 border-gray-800 rounded-full shadow-lg flex items-center justify-center'>
                                                        <div className='w-3 h-3 bg-gray-800 rounded-full'></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='flex justify-between text-sm text-gray-600 font-medium'>
                                            <span className='text-lg font-extrabold'>0%</span>
                                            <span className='text-gray-400 font-normal'>
                                                Meta de Ganancia
                                            </span>
                                            <span className='text-lg font-extrabold'>100%</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Key metrics below slider */}
                            <div className='grid grid-cols-3 gap-4 mt-8 text-center'>
                                <div className='bg-white border-2 border-red-200 rounded-xl p-3'>
                                    <div className='text-xs text-gray-600 mb-1'>Costo/unidad</div>
                                    <div className='text-lg font-bold text-red-700'>
                                        ${costPerItem.toFixed(2)}
                                    </div>
                                </div>
                                <div className='bg-white border-2 border-blue-300 rounded-xl p-3'>
                                    <div className='text-xs text-gray-600 mb-1'>
                                        Lotes necesarios
                                    </div>
                                    <div className='text-lg font-bold text-blue-700'>
                                        {metaLotes}
                                    </div>
                                </div>
                                <div className='bg-white border-2 border-green-200 rounded-xl p-3'>
                                    <div className='text-xs text-gray-600 mb-1'>
                                        Ganancia total
                                    </div>
                                    <div className='text-lg font-bold text-green-700'>
                                        $
                                        {(
                                            selectedRecipe.sellingPrice *
                                            selectedRecipe.batchSize *
                                            metaLotes -
                                            totalRecipeIngredientsCost
                                        ).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Action Buttons */}
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <Button
                            onClick={handleExportData}
                            variant='outline'
                            className='bg-amber-500 hover:bg-amber-600 text-white flex-1 text-lg py-2 shadow-sm  transition-colors'
                        >
                            <Download className='h-4 w-4 mr-2' />
                            Exportar
                        </Button>
                        <Button
                            variant='outline'
                            className='bg-gray-300 hover:bg-gray-200 text-gray-80 flex-1 text-lg py-2 shadow-sm transition-colors'
                            onClick={() =>
                                document.getElementById('import-file-mobile')?.click()
                            }
                        >
                            <Upload className='h-4 w-4 mr-2' />
                            Importar
                        </Button>
                        <input
                            id='import-file'
                            type='file'
                            accept='.json'
                            onChange={handleImportData}
                            className='hidden'
                        />
                    </div>
                </div>

                {/* MOBILE ACTION BUTTONS */}
                <div className='lg:hidden flex flex-col gap-3 pt-4'>
                    <div className='flex gap-3'>
                        <Button
                            onClick={handleExportData}
                            variant='outline'
                            className='bg-amber-500 hover:bg-amber-600 text-white flex-1 text-lg py-2 shadow-sm  transition-colors'
                        >
                            <Download className='h-4 w-4 mr-2' />
                            Exportar
                        </Button>
                        <Button
                            variant='outline'
                            className='bg-gray-300 hover:bg-gray-200 text-gray-80 flex-1 text-lg py-2 shadow-sm transition-colors'
                            onClick={() =>
                                document.getElementById('import-file-mobile')?.click()
                            }
                        >
                            <Upload className='h-4 w-4 mr-2' />
                            Importar
                        </Button>
                    </div>
                    <input
                        id='import-file-mobile'
                        type='file'
                        accept='.json'
                        onChange={handleImportData}
                        className='hidden'
                    />
                </div>
            </CardContent>

            {/* Cost Breakdown Modal */}
            {showCostModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    {/* Add backdrop click to close */}
                    <div
                        className='fixed inset-0'
                        onClick={() => setShowCostModal(false)}
                    />
                    <div className='bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl'>
                        {/* Header */}
                        <div className='p-6 border-b border-purple-100 bg-linear-to-r from-purple-50 to-indigo-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                                        <span className='text-lg'>💰</span>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold text-purple-800'>
                                            Desglose de Costos
                                        </h3>
                                        <p className='text-sm text-purple-600'>
                                            Costo total por ingrediente
                                        </p>
                                    </div>
                                </div>
                                <CloseButton onClose={() => setShowCostModal(false)} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className='p-4 overflow-y-auto max-h-64'>
                            {/* Ingredients */}
                            <h4 className='font-medium mb-2 text-amber-700'>Ingredientes</h4>
                            {selectedRecipe.ingredients.map((recipeIngredient) => {
                                const ingredient = ingredients.find(
                                    (i) => i.id === recipeIngredient.ingredientId
                                );
                                if (!ingredient) return null;

                                const cost =
                                    getIngredientCostPerUnit(ingredient) *
                                    recipeIngredient.amount;
                                const percentage = (cost / totalRecipeCost) * 100;

                                return (
                                    <div
                                        key={recipeIngredient.ingredientId}
                                        className='flex justify-between items-center py-2 border-b'
                                    >
                                        <div className='flex-1'>
                                            <div className='font-medium'>{ingredient.name}</div>
                                            <div className='text-sm text-gray-500'>
                                                {recipeIngredient.amount} {ingredient.unit} × $
                                                {getIngredientCostPerUnit(ingredient).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <div className='font-bold'>${cost.toFixed(2)}</div>
                                            <div className='text-sm text-gray-500'>
                                                {percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Tools */}
                            <h4 className='font-medium mb-2 mt-4 text-blue-700'>
                                Herramientas
                            </h4>
                            {selectedRecipe.tools?.map((recipeTool) => {
                                const tool = tools.find((t) => t.id === recipeTool.toolId);
                                if (!tool) return null;

                                const toolCost = calculateToolCost(tool, recipeTool);
                                const percentage = (toolCost / totalRecipeCost) * 100;

                                return (
                                    <div
                                        key={recipeTool.toolId}
                                        className='flex justify-between items-center py-2 border-b'
                                    >
                                        <div className='flex-1'>
                                            <div className='font-medium'>{tool.name}</div>
                                            <div className='text-sm text-gray-500'>
                                                {recipeTool.usage === 'full'
                                                    ? 'Uso completo'
                                                    : recipeTool.usage === 'partial'
                                                        ? `Uso parcial (${recipeTool.usagePercentage}%)`
                                                        : 'Depreciado'}
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <div className='font-bold'>${toolCost.toFixed(2)}</div>
                                            <div className='text-sm text-gray-500'>
                                                {percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className='p-6 border-t bg-gray-50'>
                            <div className='bg-white rounded-lg border p-4 mb-4'>
                                <div className='flex justify-between items-center mb-2'>
                                    <span className='font-bold text-gray-900'>
                                        Total de la Receta:
                                    </span>
                                    <span className='text-xl font-bold text-red-700'>
                                        ${totalRecipeCost.toFixed(2)}
                                    </span>
                                </div>
                                <div className='text-sm text-gray-600'>
                                    {selectedRecipe.ingredients.length} ingrediente
                                    {selectedRecipe.ingredients.length !== 1 ? 's' : ''} y{' '}
                                    {selectedRecipe.tools?.length || 0} herramienta
                                    {selectedRecipe.tools?.length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            <ActionButton
                                onClick={() => setShowCostModal(false)}
                                color='red'
                                fullWidth
                            >
                                Cerrar
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Unit Cost Breakdown Modal */}
            {showUnitCostModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div
                        className='fixed inset-0'
                        onClick={() => setShowUnitCostModal(false)}
                    />
                    <div className='bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl'>
                        {/* Header */}
                        <div className='p-6 border-b border-red-100 bg-gradient-to-r from-red-50 to-pink-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                                        <span className='text-lg'>📦</span>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold text-red-800'>
                                            Costo por Unidad
                                        </h3>
                                        <p className='text-sm text-red-600'>
                                            Desglose detallado por unidad
                                        </p>
                                    </div>
                                </div>
                                <CloseButton onClose={() => setShowUnitCostModal(false)} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className='p-6 overflow-y-auto max-h-96'>
                            <div className='space-y-3'>
                                <h4 className='font-medium text-amber-700 mt-4'>
                                    Ingredientes por unidad
                                </h4>
                                {selectedRecipe.ingredients.map((recipeIngredient) => {
                                    const ingredient = ingredients.find(
                                        (i) => i.id === recipeIngredient.ingredientId
                                    );
                                    if (!ingredient) return null;

                                    const unitCost =
                                        (getIngredientCostPerUnit(ingredient) *
                                            recipeIngredient.amount) /
                                        selectedRecipe.batchSize;

                                    const percentage = (unitCost / costPerItem) * 100;

                                    return (
                                        <div
                                            key={recipeIngredient.ingredientId}
                                            className='flex justify-between items-center py-2 border-b'
                                        >
                                            <div className='flex-1'>
                                                <div className='font-medium'>{ingredient.name}</div>
                                                <div className='text-sm text-gray-500'>
                                                    {recipeIngredient.amount} {ingredient.unit} ÷{' '}
                                                    {selectedRecipe.batchSize} unidades
                                                </div>
                                            </div>
                                            <div className='text-right'>
                                                <div className='font-bold'>${unitCost.toFixed(4)}</div>
                                                <div className='text-sm text-gray-500'>
                                                    {percentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Tools Section */}
                                <h4 className='font-medium text-blue-700 mt-4'>
                                    Herramientas por unidad
                                </h4>
                                {selectedRecipe.tools?.map((recipeTool) => {
                                    const tool = tools.find((t) => t.id === recipeTool.toolId);
                                    if (!tool) return null;

                                    const toolCost = calculateToolCost(tool, recipeTool);
                                    const unitToolCost = toolCost / selectedRecipe.batchSize;
                                    const percentage = (unitToolCost / costPerItem) * 100;

                                    return (
                                        <div
                                            key={recipeTool.toolId}
                                            className='flex justify-between items-center py-2 border-b'
                                        >
                                            <div className='flex-1'>
                                                <div className='font-medium'>{tool.name}</div>
                                                <div className='text-sm text-gray-500'>
                                                    {recipeTool.usage === 'full'
                                                        ? 'Uso completo'
                                                        : recipeTool.usage === 'partial'
                                                            ? `Uso parcial (${recipeTool.usagePercentage}%)`
                                                            : 'Depreciado'}{' '}
                                                    ÷ {selectedRecipe.batchSize} unidades
                                                </div>
                                            </div>
                                            <div className='text-right'>
                                                <div className='font-bold'>
                                                    ${unitToolCost.toFixed(4)}
                                                </div>
                                                <div className='text-sm text-gray-500'>
                                                    {percentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className='p-6 border-t bg-gray-50'>
                            <div className='bg-white rounded-lg border p-4 mb-4'>
                                <div className='flex justify-between items-center mb-2'>
                                    <span className='font-bold text-gray-900'>
                                        Costo por Unidad:
                                    </span>
                                    <span className='text-xl font-bold text-red-700'>
                                        ${costPerItem.toFixed(2)}
                                    </span>
                                </div>
                                <div className='text-sm text-gray-600'>
                                    {selectedRecipe.batchSize} unidades por lote
                                </div>
                            </div>
                            <ActionButton
                                onClick={() => setShowUnitCostModal(false)}
                                color='red'
                                fullWidth
                            >
                                Cerrar
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Profit Breakdown Modal */}
            {showProfitModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    {/* Add backdrop click to close */}
                    <div
                        className='fixed inset-0'
                        onClick={() => setShowProfitModal(false)}
                    />
                    <div className='bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl'>
                        {/* Header */}
                        <div className='p-6 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                                        <span className='text-lg'>💸</span>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold text-green-800'>
                                            Análisis de Ganancia
                                        </h3>
                                        <p className='text-sm text-green-600'>
                                            Rentabilidad por unidad y lote
                                        </p>
                                    </div>
                                </div>
                                <CloseButton onClose={() => setShowProfitModal(false)} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className='p-4 space-y-4'>
                            <div className='grid grid-cols-2 gap-4 text-center'>
                                <div className='bg-blue-50 p-3 rounded-lg'>
                                    <div className='text-sm text-gray-600'>Precio Venta</div>
                                    <div className='text-lg font-bold text-blue-700'>
                                        ${selectedRecipe.sellingPrice.toFixed(2)}
                                    </div>
                                </div>
                                <div className='bg-red-50 p-3 rounded-lg'>
                                    <div className='text-sm text-gray-600'>Costo por Unidad</div>
                                    <div className='text-lg font-bold text-red-700'>
                                        ${costPerItem.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakdown Section - THIS GOES HERE (OUTSIDE THE GRID) */}
                            <div className='bg-red-50 p-4 rounded-lg'>
                                <div className='text-sm font-medium text-red-700 mb-2'>
                                    Desglose de Costos por Unidad
                                </div>
                                <div className='space-y-2'>
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-gray-600'>Ingredientes:</span>
                                        <span>
                                            $
                                            {(
                                                totalRecipeIngredientsCost / selectedRecipe.batchSize
                                            ).toFixed(4)}
                                        </span>
                                    </div>
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-gray-600'>Herramientas:</span>
                                        <span>
                                            ${(totalToolCost / selectedRecipe.batchSize).toFixed(4)}
                                        </span>
                                    </div>
                                    <div className='flex justify-between text-sm font-bold border-t pt-1'>
                                        <span className='text-red-700'>Costo Total:</span>
                                        <span className='text-red-700'>
                                            ${costPerItem.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='bg-green-50 p-4 rounded-lg'>
                                <div className='flex justify-between items-center mb-2'>
                                    <span className='font-medium'>Ganancia por Unidad:</span>
                                    <span className='text-lg font-bold text-green-700'>
                                        ${profit.toFixed(2)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className='font-medium'>Margen de Ganancia:</span>
                                    <span className='text-lg font-bold text-green-700'>
                                        {profitPercentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className='bg-amber-50 p-3 rounded-lg'>
                                <div className='text-sm text-gray-600 mb-1'>
                                    Ganancia Total por Lote
                                </div>
                                <div className='text-lg font-bold text-amber-700'>
                                    ${(profit * selectedRecipe.batchSize).toFixed(2)}
                                </div>
                                <div className='text-xs text-gray-500'>
                                    {selectedRecipe.batchSize} unidades × ${profit.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className='p-4 border-t bg-gray-50'>
                            <button
                                onClick={() => setShowProfitModal(false)}
                                className='w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors'
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Margin Analysis Modal */}
            {showMarginModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div
                        className='fixed inset-0'
                        onClick={() => setShowMarginModal(false)}
                    />
                    <div className='bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl'>
                        {/* Header */}
                        <div className='p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                                        <span className='text-lg'>📊</span>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold text-blue-800'>
                                            Análisis de Margen
                                        </h3>
                                        <p className='text-sm text-blue-600'>
                                            Evaluación de rentabilidad
                                        </p>
                                    </div>
                                </div>
                                <CloseButton onClose={() => setShowMarginModal(false)} />
                            </div>
                        </div>

                        <div className='p-6 space-y-4'>
                            {/* Profitability Indicator */}
                            <div className='text-center'>
                                <div
                                    className={`text-lg font-bold ${profitPercentage >= 50
                                            ? 'text-green-600'
                                            : profitPercentage >= 30
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`}
                                >
                                    {profitPercentage >= 50
                                        ? '🟢 Excelente'
                                        : profitPercentage >= 30
                                            ? '🟡 Buena'
                                            : '🔴 Baja'}{' '}
                                    Rentabilidad
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className='space-y-2'>
                                <div className='flex justify-between text-sm'>
                                    <span>0%</span>
                                    <span>Margen Actual: {profitPercentage.toFixed(1)}%</span>
                                    <span>100%</span>
                                </div>
                                <div className='w-full bg-gray-200 rounded-full h-4'>
                                    <div
                                        className={`h-4 rounded-full transition-all duration-300 ${profitPercentage >= 50
                                                ? 'bg-green-500'
                                                : profitPercentage >= 30
                                                    ? 'bg-yellow-500'
                                                    : 'bg-red-500'
                                            }`}
                                        style={{ width: `${Math.min(profitPercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Cost Composition */}
                            <div className='bg-amber-50 p-3 rounded-lg border border-amber-200'>
                                <div className='text-sm font-medium text-amber-800 mb-2'>
                                    Composición del Costo (por unidad)
                                </div>
                                <div className='space-y-1'>
                                    <div className='flex justify-between text-xs'>
                                        <span className='text-gray-600'>Ingredientes:</span>
                                        <span>
                                            $
                                            {(
                                                totalRecipeIngredientsCost / selectedRecipe.batchSize
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='flex justify-between text-xs'>
                                        <span className='text-gray-600'>Herramientas:</span>
                                        <span>
                                            ${(totalToolCost / selectedRecipe.batchSize).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='flex justify-between text-xs font-bold pt-1 border-t'>
                                        <span className='text-red-700'>Costo Total:</span>
                                        <span className='text-red-700'>
                                            ${costPerItem.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='bg-red-50 p-3 rounded-lg'>
                                    <div className='text-xs text-gray-600'>Costo</div>
                                    <div className='font-bold text-red-700'>
                                        ${costPerItem.toFixed(2)}
                                    </div>
                                </div>
                                <div className='bg-green-50 p-3 rounded-lg'>
                                    <div className='text-xs text-gray-600'>Ganancia</div>
                                    <div className='font-bold text-green-700'>
                                        ${profit.toFixed(2)}
                                    </div>
                                </div>
                                <div className='bg-blue-50 p-3 rounded-lg'>
                                    <div className='text-xs text-gray-600'>Precio Venta</div>
                                    <div className='font-bold text-blue-700'>
                                        ${selectedRecipe.sellingPrice.toFixed(2)}
                                    </div>
                                </div>
                                <div className='bg-purple-50 p-3 rounded-lg'>
                                    <div className='text-xs text-gray-600'>Por cada $1</div>
                                    <div className='font-bold text-purple-700'>
                                        ${(profitPercentage / 100).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className='bg-gray-50 p-3 rounded-lg'>
                                <div className='text-sm font-medium text-gray-700 mb-1'>
                                    Recomendación:
                                </div>
                                <div className='text-xs text-gray-600'>
                                    {profitPercentage >= 50
                                        ? '✅ Margen saludable. Mantén este precio.'
                                        : profitPercentage >= 30
                                            ? '⚠️  Margen aceptable. Considera optimizar costos.'
                                            : '❌ Margen bajo. Revisa costos o aumenta precio.'}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className='p-6 border-t bg-gray-50'>
                            <ActionButton
                                onClick={() => setShowMarginModal(false)}
                                color='blue'
                                fullWidth
                            >
                                Cerrar
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal showing only recipe ingredients */}
            {showTotalIngredientsModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div
                        className='fixed inset-0'
                        onClick={() => setShowTotalIngredientsModal(false)}
                    />
                    <div className='bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl'>
                        {/* Header */}
                        <div className='p-6 border-b border-red-100 bg-gradient-to-r from-red-50 to-pink-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                                        <span className='text-lg'>🥘</span>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold text-red-800'>
                                            Ingredientes en Receta
                                        </h3>
                                        <p className='text-sm text-red-600'>
                                            Lista completa de ingredientes
                                        </p>
                                    </div>
                                </div>
                                <CloseButton
                                    onClose={() => setShowTotalIngredientsModal(false)}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className='p-6 overflow-y-auto max-h-96'>
                            {selectedRecipe.ingredients.map((recipeIngredient) => {
                                const ingredient = ingredients.find(
                                    (i) => i.id === recipeIngredient.ingredientId
                                );
                                if (!ingredient) return null;

                                return (
                                    <div
                                        key={recipeIngredient.ingredientId}
                                        className='flex justify-between items-center py-2 border-b'
                                    >
                                        <div className='flex-1'>
                                            <div className='font-medium'>{ingredient.name}</div>
                                            <div className='text-sm text-gray-500'>
                                                {recipeIngredient.amount} {ingredient.unit}
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <div className='font-bold text-red-700'>
                                                $
                                                {(
                                                    getIngredientCostPerUnit(ingredient) *
                                                    recipeIngredient.amount
                                                ).toFixed(2)}
                                            </div>
                                            <div className='text-sm text-gray-500'>
                                                ${getIngredientCostPerUnit(ingredient).toFixed(2)}/
                                                {ingredient.unit}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className='p-4 border-t bg-gray-50'>
                            <div className='flex justify-between items-center font-bold text-lg mb-2'>
                                <span>Total Receta:</span>
                                <span className='text-red-700'>
                                    ${totalRecipeIngredientsCost.toFixed(2)}
                                </span>
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                                {selectedRecipe.ingredients.length} ingrediente
                                {selectedRecipe.ingredients.length !== 1 ? 's' : ''} en esta
                                receta
                            </div>
                            <button
                                onClick={() => setShowTotalIngredientsModal(false)}
                                className='w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors'
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lotes Explanation Modal */}
            {showLotesModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div
                        className='fixed inset-0'
                        onClick={() => setShowLotesModal(false)}
                    />
                    <div className='bg-white rounded-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden relative z-10 shadow-xl'>
                        {/* Swipe indicator for mobile */}
                        <div className='lg:hidden flex justify-center pt-3 pb-1'>
                            <div className='w-12 h-1.5 bg-gray-300 rounded-full'></div>
                        </div>

                        {/* Header */}
                        <div className='p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                                        <span className='text-lg'>🎯</span>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold text-blue-800'>
                                            Meta de Lotes
                                        </h3>
                                        <p className='text-sm text-blue-600'>
                                            Punto de equilibrio de ingredientes
                                        </p>
                                    </div>
                                </div>
                                <CloseButton onClose={() => setShowLotesModal(false)} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className='p-6 space-y-4 overflow-y-auto max-h-96'>
                            {/* Objective */}
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <svg
                                        className='w-4 h-4 text-blue-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                        />
                                    </svg>
                                    <div className='text-sm font-semibold text-blue-800'>
                                        Objetivo
                                    </div>
                                </div>
                                <div className='text-sm text-blue-700'>
                                    Vender suficientes lotes para cubrir el costo total de los
                                    ingredientes de esta receta.
                                </div>
                            </div>

                            {/* Calculation Breakdown */}
                            <div className='space-y-3'>
                                <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                                    <span className='text-sm font-medium text-gray-700'>
                                        Costo total ingredientes:
                                    </span>
                                    <span className='font-bold text-red-600'>
                                        ${totalRecipeIngredientsCost.toFixed(2)}
                                    </span>
                                </div>

                                <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                                    <span className='text-sm font-medium text-gray-700'>
                                        Ingresos por lote:
                                    </span>
                                    <span className='font-bold text-green-600'>
                                        $
                                        {(
                                            selectedRecipe.sellingPrice * selectedRecipe.batchSize
                                        ).toFixed(2)}
                                    </span>
                                </div>

                                <div className='border-t border-blue-200 pt-3'>
                                    <div className='flex justify-between items-center mb-2'>
                                        <span className='text-lg font-bold text-blue-700'>
                                            Lotes necesarios:
                                        </span>
                                        <span className='text-2xl font-bold text-blue-700'>
                                            {metaLotes}
                                        </span>
                                    </div>
                                    <div className='text-xs text-gray-500 bg-blue-50 p-2 rounded'>
                                        {totalRecipeIngredientsCost.toFixed(2)} ÷{' '}
                                        {(
                                            selectedRecipe.sellingPrice * selectedRecipe.batchSize
                                        ).toFixed(2)}{' '}
                                        ={' '}
                                        {Math.ceil(
                                            totalRecipeIngredientsCost /
                                            (selectedRecipe.sellingPrice * selectedRecipe.batchSize)
                                        )}{' '}
                                        lotes
                                    </div>
                                </div>
                            </div>

                            {/* Example */}
                            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <svg
                                        className='w-4 h-4 text-green-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                        />
                                    </svg>
                                    <div className='text-sm font-semibold text-green-800'>
                                        Ejemplo Práctico
                                    </div>
                                </div>
                                <div className='text-sm text-green-700'>
                                    Si vendes <strong>{metaLotes} lotes</strong> de{' '}
                                    {selectedRecipe.name}, cubrirás el costo de{' '}
                                    <strong>${totalRecipeIngredientsCost.toFixed(2)}</strong> en
                                    ingredientes. Cada lote adicional será{' '}
                                    <strong>ganancia pura</strong>.
                                </div>
                            </div>

                            {/* Note */}
                            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <svg
                                        className='w-4 h-4 text-amber-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
                                        />
                                    </svg>
                                    <div className='text-sm font-semibold text-amber-800'>
                                        Nota Importante
                                    </div>
                                </div>
                                <div className='text-xs text-amber-700'>
                                    Esto solo cubre el costo de ingredientes. No incluye otros
                                    gastos como mano de obra, empaque, servicios, o costos
                                    operativos.
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='bg-white border border-gray-200 rounded-lg p-3 text-center'>
                                    <div className='text-xs text-gray-600 mb-1'>
                                        Ganancia por lote
                                    </div>
                                    <div className='text-lg font-bold text-green-600'>
                                        ${(profit * selectedRecipe.batchSize).toFixed(2)}
                                    </div>
                                </div>
                                <div className='bg-white border border-gray-200 rounded-lg p-3 text-center'>
                                    <div className='text-xs text-gray-600 mb-1'>
                                        Unidades por lote
                                    </div>
                                    <div className='text-lg font-bold text-blue-600'>
                                        {selectedRecipe.batchSize}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className='p-6 border-t bg-gray-50'>
                            <ActionButton
                                onClick={() => setShowLotesModal(false)}
                                color='blue'
                                fullWidth
                            >
                                Entendido
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Approximate Profit Modal */}
            {showProfitGoalModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div
                        className='fixed inset-0'
                        onClick={() => setShowProfitGoalModal(false)}
                    />
                    <div className='bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden relative z-10'>
                        {/* Header */}
                        <div className='p-6 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                                        <svg
                                            className='w-6 h-6 text-green-600'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold text-green-800'>
                                            Ganancia Aproximada
                                        </h3>
                                        <p className='text-sm text-green-600'>
                                            Proyección de ganancias potenciales
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowProfitGoalModal(false)}
                                    className='w-8 h-8 flex items-center justify-center text-green-500 hover:text-green-700 hover:bg-green-100 rounded-full transition-colors'
                                >
                                    <svg
                                        className='w-5 h-5'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className='p-6 space-y-6 overflow-y-auto max-h-[60vh]'>
                            {/* Key Metrics Summary */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 text-center'>
                                    <div className='text-xs font-medium text-blue-600 mb-1'>
                                        Meta de Lotes
                                    </div>
                                    <div className='text-2xl font-bold text-blue-700'>
                                        {metaLotes}
                                    </div>
                                    <div className='text-xs text-blue-500 mt-1'>
                                        para cubrir costos
                                    </div>
                                </div>

                                <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 text-center'>
                                    <div className='text-xs font-medium text-purple-600 mb-1'>
                                        Ganancia Total
                                    </div>
                                    <div className='text-2xl font-bold text-purple-700'>
                                        $
                                        {(
                                            selectedRecipe.sellingPrice *
                                            selectedRecipe.batchSize *
                                            metaLotes -
                                            totalRecipeIngredientsCost
                                        ).toFixed(2)}
                                    </div>
                                    <div className='text-xs text-purple-500 mt-1'>aproximada</div>
                                </div>
                            </div>

                            {/* Breakdown Section */}
                            <div className='space-y-4'>
                                <h4 className='font-semibold text-gray-800 flex items-center gap-2'>
                                    <svg
                                        className='w-4 h-4 text-gray-500'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                                        />
                                    </svg>
                                    Desglose de Proyección
                                </h4>

                                {/* Investment */}
                                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                                    <div className='flex justify-between items-center mb-2'>
                                        <span className='text-sm font-medium text-red-700'>
                                            Inversión en Ingredientes
                                        </span>
                                        <span className='text-lg font-bold text-red-700'>
                                            ${totalRecipeIngredientsCost.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='text-xs text-red-600'>
                                        Costo total de todos los ingredientes de la receta
                                    </div>
                                </div>

                                {/* Revenue Projection */}
                                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                                    <div className='flex justify-between items-center mb-2'>
                                        <span className='text-sm font-medium text-green-700'>
                                            Ingresos por {metaLotes} lotes
                                        </span>
                                        <span className='text-lg font-bold text-green-700'>
                                            $
                                            {(
                                                selectedRecipe.sellingPrice *
                                                selectedRecipe.batchSize *
                                                metaLotes
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='text-xs text-green-600'>
                                        {metaLotes} lotes × $
                                        {selectedRecipe.sellingPrice.toFixed(2)}/unidad ×{' '}
                                        {selectedRecipe.batchSize} unidades
                                    </div>
                                </div>

                                {/* Net Profit */}
                                <div className='bg-gradient-to-r from-emerald-500 to-green-500 border border-green-500 rounded-lg p-4 text-white'>
                                    <div className='flex justify-between items-center mb-1'>
                                        <span className='text-sm font-medium'>
                                            Ganancia Neta Aproximada
                                        </span>
                                        <span className='text-xl font-bold'>
                                            $
                                            {(
                                                selectedRecipe.sellingPrice *
                                                selectedRecipe.batchSize *
                                                metaLotes -
                                                totalRecipeIngredientsCost
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='text-xs opacity-90'>
                                        Después de recuperar la inversión en ingredientes
                                    </div>
                                </div>
                            </div>

                            {/* Profitability Indicator - Interactive Slider */}
                            {/* Profitability Indicator - Interactive Slider */}
                            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                                <div className='flex items-center justify-between mb-3'>
                                    <span className='text-sm font-medium text-gray-700'>
                                        Margen de Ganancia
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${profitPercentage >= 50
                                                ? 'text-green-600'
                                                : profitPercentage >= 30
                                                    ? 'text-yellow-600'
                                                    : 'text-red-600'
                                            }`}
                                    >
                                        {profitPercentage.toFixed(0)}% (
                                        {profitPercentage >= 50
                                            ? 'Excelente'
                                            : profitPercentage >= 30
                                                ? 'Buena'
                                                : 'Moderada'}
                                        )
                                    </span>
                                </div>

                                <div className='space-y-2'>
                                    <div className='flex justify-between text-xs text-gray-600'>
                                        <span>0%</span>
                                        <span className='font-medium'>
                                            Retorno:{' '}
                                            {(
                                                ((selectedRecipe.sellingPrice *
                                                    selectedRecipe.batchSize *
                                                    metaLotes -
                                                    totalRecipeIngredientsCost) /
                                                    totalRecipeIngredientsCost) *
                                                100
                                            ).toFixed(1)}
                                            %
                                        </span>
                                        <span>100%</span>
                                    </div>

                                    <div
                                        ref={sliderRef}
                                        className='relative w-full h-6 flex items-center cursor-pointer touch-none'
                                        onMouseDown={startDragging}
                                        onTouchStart={startDragging}
                                    >
                                        {/* Track Background */}
                                        <div className='w-full h-2 bg-gray-200 rounded-full' />

                                        {/* Fill Progress */}
                                        <div
                                            className='absolute h-2 bg-blue-600 rounded-full pointer-events-none'
                                            style={{
                                                width: `${Math.max(
                                                    0,
                                                    Math.min(100, profitPercentage)
                                                )}%`,
                                            }}
                                        />

                                        {/* Interactive Thumb (Dot) */}
                                        <div
                                            className='absolute w-6 h-6 bg-white border-4 border-blue-600 rounded-full shadow-md pointer-events-none'
                                            style={{
                                                left: `${Math.max(
                                                    0,
                                                    Math.min(100, profitPercentage)
                                                )}%`,
                                                transform: 'translateX(-50%)',
                                            }}
                                        />
                                    </div>

                                    <div className='text-xs text-gray-500 text-center mt-2'>
                                        Desliza para ajustar precio automáticamente
                                    </div>
                                </div>
                            </div>

                            {/* Key Insights */}
                            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                                <h5 className='font-semibold text-amber-800 mb-3 flex items-center gap-2'>
                                    <svg
                                        className='w-4 h-4'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                        />
                                    </svg>
                                    Puntos Clave
                                </h5>
                                <ul className='space-y-2 text-sm text-amber-700'>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-amber-500 mt-0.5'>•</span>
                                        <span>
                                            Vender <strong>{metaLotes} lotes</strong> cubre tu
                                            inversión inicial
                                        </span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-amber-500 mt-0.5'>•</span>
                                        <span>
                                            Cada lote adicional genera{' '}
                                            <strong>
                                                ${(profit * selectedRecipe.batchSize).toFixed(2)}
                                            </strong>{' '}
                                            de ganancia pura
                                        </span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-amber-500 mt-0.5'>•</span>
                                        <span>
                                            Tu margen por unidad es{' '}
                                            <strong>{profitPercentage.toFixed(1)}%</strong> ($
                                            {profit.toFixed(2)})
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='p-6 border-t border-gray-200 bg-gray-50'>
                            <div className='flex flex-col gap-3'>
                                <button
                                    onClick={() => setShowProfitGoalModal(false)}
                                    className='w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2'
                                >
                                    <svg
                                        className='w-5 h-5'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M5 13l4 4L19 7'
                                        />
                                    </svg>
                                    Entendido
                                </button>

                                <button
                                    onClick={() => {
                                        setShowProfitGoalModal(false);
                                        setShowLotesModal(true);
                                    }}
                                    className='w-full bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg border border-gray-300 font-medium transition-colors duration-200 text-sm'
                                >
                                    Ver detalles de la meta de lotes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl max-w-md w-full shadow-xl'>
                        <div className='p-6 border-b border-green-100'>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                                    <svg
                                        className='w-5 h-5 text-green-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-lg font-bold text-gray-800'>
                                        Confirmar Producción
                                    </h3>
                                    <p className='text-sm text-gray-600'>Registrar producción</p>
                                </div>
                            </div>
                        </div>

                        <div className='p-6'>
                            <div className='text-center mb-4'>
                                <div className='text-lg font-semibold text-gray-800'>
                                    {selectedRecipe.name}
                                </div>
                                <div className='text-3xl font-bold text-purple-600 my-2'>
                                    {productionBatchCount} lote
                                    {productionBatchCount !== 1 ? 's' : ''}
                                </div>
                                <div className='text-gray-600'>
                                    = {productionBatchCount * selectedRecipe.batchSize} unidades
                                </div>
                            </div>

                            <div className='bg-gray-50 rounded-lg p-4 mb-4'>
                                <div className='flex justify-between text-sm mb-1'>
                                    <span className='text-gray-600'>Costo total:</span>
                                    <span className='font-medium'>
                                        ${(totalRecipeCost * productionBatchCount).toFixed(2)}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span className='text-gray-600'>Ingresos estimados:</span>
                                    <span className='font-medium text-green-600'>
                                        $
                                        {(
                                            selectedRecipe.sellingPrice *
                                            selectedRecipe.batchSize *
                                            productionBatchCount
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className='flex gap-3'>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className='flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        recordProduction(selectedRecipe.id, productionBatchCount);
                                        setProductionBatchCount(1);
                                        setShowConfirmModal(false);

                                        // Add toast success message
                                        toast.success(
                                            <div>
                                                <div className='font-semibold'>
                                                    Producción Registrada
                                                </div>
                                                <div className='text-sm'>
                                                    {productionBatchCount} lote(s) de{' '}
                                                    {selectedRecipe.name}
                                                </div>
                                            </div>,
                                            {
                                                duration: 3000,
                                                style: {
                                                    background: '#f0fdf4',
                                                    color: '#166534',
                                                    border: '1px solid #86efac',
                                                    padding: '12px 16px',
                                                    borderRadius: '8px',
                                                },
                                            }
                                        );
                                    }}
                                    className='flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium'
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showToolUsageModal && selectedRecipeTool && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-xl p-6 max-w-md w-full mx-4'>
                        <h3 className='text-lg font-bold mb-4'>
                            Configurar uso de {selectedRecipeTool.toolName}
                        </h3>

                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium mb-2'>
                                    Tipo de uso
                                </label>
                                <select
                                    className='w-full border rounded-lg p-2'
                                    value={selectedRecipeTool.currentUsage || 'full'}
                                    onChange={(e) =>
                                        setSelectedRecipeTool({
                                            ...selectedRecipeTool,
                                            currentUsage: e.target.value as ToolUsage,
                                        })
                                    }
                                >
                                    <option value='full'>Uso completo (100%)</option>
                                    <option value='partial'>Uso parcial</option>
                                    <option value='depreciated'>Depreciado (0%)</option>
                                </select>
                            </div>

                            {selectedRecipeTool.currentUsage === 'partial' && (
                                <div>
                                    <label className='block text-sm font-medium mb-2'>
                                        Porcentaje de uso (
                                        {selectedRecipeTool.currentPercentage || 50}%)
                                    </label>
                                    <input
                                        type='range'
                                        min='1'
                                        max='100'
                                        value={selectedRecipeTool.currentPercentage || 50}
                                        onChange={(e) =>
                                            setSelectedRecipeTool({
                                                ...selectedRecipeTool,
                                                currentPercentage: parseInt(e.target.value),
                                            })
                                        }
                                        className='w-full'
                                    />
                                </div>
                            )}

                            <div className='flex gap-2 pt-4'>
                                <button
                                    onClick={() => setShowToolUsageModal(false)}
                                    className='flex-1 py-2 border rounded-lg hover:bg-gray-50'
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        updateToolUsage(
                                            selectedRecipeTool.toolId,
                                            selectedRecipeTool.currentUsage || 'full',
                                            selectedRecipeTool.currentPercentage
                                        );
                                        setShowToolUsageModal(false);
                                    }}
                                    className='flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
