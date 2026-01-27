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
// Add import at top
import { generateMockProductionData } from '@/lib/mock-data'



export function RecipeCalculator() {
    // Ingredients management
    const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients);
    const [tools, setTools] = useState<Tool[]>(defaultTools);
    const [recipes, setRecipes] = useState<Recipe[]>(products.map(p => p.recipe))
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0])
    const [mobileView, setMobileView] = useState<'ingredients' | 'calculator' | 'production'>('calculator')
    // const [productionHistory, setProductionHistory] = useState<ProductionRecord[]>([])
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
    
    const [productionHistory, setProductionHistory] = useState<ProductionRecord[]>(() => {
        return generateMockProductionData(products.map(p => p.recipe), products)
    })
    
    const [ingredientsInDatabase, setIngredientsInDatabase] = useState<Set<string>>(new Set());
    // recipesInDatabase: Tracks which recipes are in Supabase (for future DB indicators in UI)
    const [recipesInDatabase, setRecipesInDatabase] = useState<Set<string>>(new Set());
    const [toolsInDatabase, setToolsInDatabase] = useState<Set<string>>(new Set());
    const [inventoryInDatabase, setInventoryInDatabase] = useState<Set<string>>(new Set()); // ingredientId -> in DB

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

    // Improved loadDatabaseRecipes: Merge DB recipes with local, DB takes priority
    const loadDatabaseRecipes = async () => {
        setLoadingDatabase(true)
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            // Store DB recipe IDs
            const dbIds = new Set<string>();
            const dbRecipeMap = new Map<string, Recipe>(); // key: "name" -> Recipe

            // Convert Supabase data to Recipe format
            const transformedRecipes: Recipe[] = (data || []).map(dbRecipe => {
                const recipe: Recipe = {
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
                };

                dbIds.add(dbRecipe.id);
                // Create unique key: name (lowercase, trimmed)
                const uniqueKey = dbRecipe.name.toLowerCase().trim();
                dbRecipeMap.set(uniqueKey, recipe);

                return recipe;
            });

            setRecipesInDatabase(dbIds); // Track DB recipes for future UI indicators
            setDatabaseRecipes(transformedRecipes);

            // Merge with local recipes: DB takes priority, keep unique local-only recipes
            setRecipes(prevRecipes => {
                // Filter local recipes: only keep those with unique name not in DB
                const localOnlyRecipes = prevRecipes.filter(localRecipe => {
                    // Skip if already in database by ID
                    if (dbIds.has(localRecipe.id)) {
                        return false;
                    }

                    // Check if name exists in DB
                    const uniqueKey = localRecipe.name.toLowerCase().trim();
                    return !dbRecipeMap.has(uniqueKey);
                });

                // Combine: DB recipes (priority) + unique local-only recipes
                const mergedRecipes = [...transformedRecipes, ...localOnlyRecipes];

                // Sort by name for consistent display
                mergedRecipes.sort((a, b) => a.name.localeCompare(b.name));

                // Update selected recipe if it was deleted or if we need a default
                if (mergedRecipes.length > 0) {
                    setSelectedRecipe(prev => {
                        // If current selected recipe still exists, keep it
                        const stillExists = mergedRecipes.find(r => r.id === prev.id);
                        if (stillExists) return prev;
                        // Otherwise select first recipe
                        return mergedRecipes[0];
                    });
                }

                return mergedRecipes;
            });
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

    // Improved handleRecipeSaved: Uses functional updates and syncs with DB state
    const handleRecipeSaved = (recipe: Recipe) => {
        // If recipe is saved to DB, mark it as in database
        // recipesInDatabase is used to track which recipes are in Supabase (for future DB indicators)
        if (recipe.id && !recipe.id.startsWith('recipe-')) {
            // Recipe has DB ID (not a local-only ID)
            setRecipesInDatabase(prev => new Set([...prev, recipe.id]));
        }

        setRecipes(prev => {
            const existingIndex = prev.findIndex(r => r.id === recipe.id)
            
            if (existingIndex >= 0) {
                // Update existing recipe
                const updated = [...prev]
                updated[existingIndex] = recipe
                // Sort by name
                updated.sort((a, b) => a.name.localeCompare(b.name))
                return updated
            } else {
                // Add new recipe
                const updated = [...prev, recipe]
                // Sort by name
                updated.sort((a, b) => a.name.localeCompare(b.name))
                return updated
            }
        })

        // Update selected recipe if it's the one being edited (use functional update)
        setSelectedRecipe(prev => {
            if (prev.id === recipe.id) {
                return recipe
            }
            return prev
        })

        // Reload database recipes to ensure sync
        loadDatabaseRecipes()
    }

    // Fixed handleRecipeDeleted: Uses functional updates to avoid stale state
    const handleRecipeDeleted = (recipeId: string) => {
        // Compute next recipes list locally to avoid stale state
        setRecipes(prev => {
            const nextRecipes = prev.filter(r => r.id !== recipeId)
            
            // Update selected recipe if the deleted one was selected
            setSelectedRecipe(prevSelected => {
                if (prevSelected.id === recipeId) {
                    // Use nextRecipes (not prev/recipes) to avoid stale state
                    return nextRecipes.length > 0 ? nextRecipes[0] : prevSelected
                }
                return prevSelected
            })
            
            return nextRecipes
        })

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

        // Set initial ingredients (will be merged with DB in loadIngredientsFromSupabase)
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

    // Save to localStorage with error handling - only save DB ingredients + unique local
    useEffect(() => {
        // Only save ingredients that are either in DB or truly unique local-only
        // This ensures localStorage doesn't store duplicates that will be filtered out
        const ingredientsToSave = ingredients.filter(ing => {
            // Always save DB ingredients
            if (ingredientsInDatabase.has(ing.id)) {
                return true;
            }
            // For local ingredients, check if there's a DB duplicate by name+unit
            const uniqueKey = `${ing.name.toLowerCase().trim()}|${ing.unit}`;
            const hasDbDuplicate = ingredients.some(dbIng => 
                ingredientsInDatabase.has(dbIng.id) &&
                `${dbIng.name.toLowerCase().trim()}|${dbIng.unit}` === uniqueKey
            );
            // Only save if no DB duplicate exists
            return !hasDbDuplicate;
        });
        
        safeSetLocalStorage('recipe-calculator-ingredients', ingredientsToSave);
    }, [ingredients, ingredientsInDatabase])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-recipes', recipes)
    }, [recipes])

    useEffect(() => {
        safeSetLocalStorage('recipe-calculator-production-history', productionHistory)
    }, [productionHistory])

    // Save to localStorage with error handling - only save DB inventory + unique local
    useEffect(() => {
        // Only save inventory items that are either in DB or truly unique local-only
        const inventoryToSave = inventory.filter(item => {
            // Always save DB inventory
            if (inventoryInDatabase.has(item.ingredientId)) {
                return true;
            }
            // For local items, check if there's a DB duplicate
            const hasDbDuplicate = inventory.some(dbItem => 
                inventoryInDatabase.has(dbItem.ingredientId) &&
                dbItem.ingredientId === item.ingredientId
            );
            // Only save if no DB duplicate exists
            return !hasDbDuplicate;
        });
        
        safeSetLocalStorage('recipe-calculator-inventory', inventoryToSave);
    }, [inventory, inventoryInDatabase]);

    // Save to localStorage with error handling - only save DB tools + unique local
    useEffect(() => {
        // Only save tools that are either in DB or truly unique local-only
        const toolsToSave = tools.filter(tool => {
            // Always save DB tools
            if (toolsInDatabase.has(tool.id)) {
                return true;
            }
            // For local tools, check if there's a DB duplicate by name+category
            const uniqueKey = `${tool.name.toLowerCase().trim()}|${tool.category}`;
            const hasDbDuplicate = tools.some(dbTool => 
                toolsInDatabase.has(dbTool.id) &&
                `${dbTool.name.toLowerCase().trim()}|${dbTool.category}` === uniqueKey
            );
            // Only save if no DB duplicate exists
            return !hasDbDuplicate;
        });
        
        safeSetLocalStorage('recipe-calculator-tools', toolsToSave);
    }, [tools, toolsInDatabase])

    useEffect(() => {
        loadDatabaseRecipes()
    }, [])
    
    // Load ingredients from Supabase after initial localStorage load
    // This ensures DB ingredients take priority over local duplicates
    // Using functional state updates in loadIngredientsFromSupabase ensures we work with latest state
    useEffect(() => {
        const loadIngredients = async () => {
            await loadIngredientsFromSupabase();
        };
        loadIngredients();
    }, []);

    // Load tools from Supabase after initial localStorage load
    // This ensures DB tools take priority over local duplicates
    useEffect(() => {
        const loadTools = async () => {
            await loadToolsFromSupabase();
        };
        loadTools();
    }, []);

    // Load inventory from Supabase after initial localStorage load
    // This ensures DB inventory takes priority over local duplicates
    useEffect(() => {
        const loadInventory = async () => {
            await loadInventoryFromSupabase();
        };
        loadInventory();
    }, []);

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

        // Update inventory (deduct ingredients used) and sync to Supabase
        setInventory(prev => {
            const updatedInventory = [...prev]
            recipe.ingredients.forEach(recipeIngredient => {
                const inventoryItem = updatedInventory.find(item => item.ingredientId === recipeIngredient.ingredientId)
                if (inventoryItem) {
                    const amountUsed = recipeIngredient.amount * validBatchCount
                    const newStock = Math.max(0, inventoryItem.currentStock - amountUsed)
                    inventoryItem.currentStock = newStock
                    inventoryItem.lastUpdated = new Date().toISOString()

                    // Sync to Supabase if available
                    if (saveInventoryToSupabase) {
                        saveInventoryToSupabase(inventoryItem).catch(error => {
                            console.error('Failed to sync inventory after production:', error)
                            setError('Error al sincronizar inventario. Verifica tu conexión.')
                        })
                    }
                }
            })
            return updatedInventory
        })
    }

    // Improved updateInventory: Syncs with Supabase when available
    const updateInventory = async (ingredientId: string, newStock: number) => {
        const validStock = validateNumber(newStock.toString(), 0, 100000)

        setInventory(prev => {
            // Check if item exists
            const existingItemIndex = prev.findIndex(item => item.ingredientId === ingredientId)

            if (existingItemIndex >= 0) {
                // Update existing item
                const updated = [...prev]
                const updatedItem = {
                    ...updated[existingItemIndex],
                    currentStock: validStock,
                    lastUpdated: new Date().toISOString()
                }
                updated[existingItemIndex] = updatedItem

                // Sync to Supabase if available
                if (saveInventoryToSupabase) {
                    saveInventoryToSupabase(updatedItem).catch(error => {
                        console.error('Failed to sync inventory to Supabase:', error)
                        setError('Error al sincronizar inventario. Verifica tu conexión.')
                    })
                }

                return updated
            } else {
                // Create new inventory item
                const ingredient = ingredients.find(ing => ing.id === ingredientId)
                if (!ingredient) return prev // Safety check

                const newItem: InventoryItem = {
                    ingredientId,
                    currentStock: validStock,
                    unit: ingredient.unit,
                    minimumStock: 0,
                    lastUpdated: new Date().toISOString()
                }

                // Sync to Supabase if available
                if (saveInventoryToSupabase) {
                    saveInventoryToSupabase(newItem).catch(error => {
                        console.error('Failed to sync inventory to Supabase:', error)
                        setError('Error al sincronizar inventario. Verifica tu conexión.')
                    })
                }

                return [...prev, newItem]
            }
        })
    }

    // Improved loadIngredientsFromSupabase: Prioritize DB, filter local duplicates
    // Uses functional state update to ensure we work with latest ingredients state
    const loadIngredientsFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('ingredients')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error;

            // Store Supabase IDs
            const dbIds = new Set<string>();
            const dbIngredientMap = new Map<string, Ingredient>(); // key: "name|unit" -> Ingredient

            // Convert Supabase data to Ingredient format
            const supabaseIngredients: Ingredient[] = (data || []).map(dbIng => {
                const ingredient: Ingredient = {
                    id: dbIng.id,
                    name: dbIng.name,
                    price: dbIng.price,
                    unit: dbIng.unit,
                    amount: dbIng.amount,
                    minAmount: dbIng.min_amount || 0,
                    minAmountUnit: dbIng.min_amount_unit || dbIng.unit,
                    containsAmount: dbIng.contains_amount || 0,
                    containsUnit: dbIng.contains_unit || 'unit'
                };

                dbIds.add(dbIng.id);
                // Create unique key: name (lowercase) + unit
                const uniqueKey = `${dbIng.name.toLowerCase().trim()}|${dbIng.unit}`;
                dbIngredientMap.set(uniqueKey, ingredient);

                return ingredient;
            });

            setIngredientsInDatabase(dbIds);

            // Use functional update to get latest ingredients state
            setIngredients(prevIngredients => {
                // Filter local ingredients: only keep those with unique name+unit not in DB
                const localOnlyIngredients = prevIngredients.filter(localIng => {
                    // Skip if already in database by ID
                    if (dbIds.has(localIng.id)) {
                        return false;
                    }

                    // Check if name+unit combination exists in DB
                    const uniqueKey = `${localIng.name.toLowerCase().trim()}|${localIng.unit}`;
                    return !dbIngredientMap.has(uniqueKey);
                });

                // Combine: DB ingredients (priority) + unique local-only ingredients
                const mergedIngredients = [...supabaseIngredients, ...localOnlyIngredients];

                // Sort by name for consistent display
                mergedIngredients.sort((a, b) => a.name.localeCompare(b.name));

                return mergedIngredients;
            });
        } catch (error) {
            console.error('Error loading ingredients from Supabase:', error);
            setError('Error al cargar ingredientes de la base de datos');
        }
    }


    // Improved saveIngredientToSupabase: Better duplicate detection and state sync
    const saveIngredientToSupabase = async (ingredient: Ingredient): Promise<Ingredient> => {
        try {
            // Normalize name and unit for comparison
            const normalizedName = ingredient.name.trim();
            const normalizedUnit = ingredient.unit.trim();

            // Check if ingredient exists in Supabase by name AND unit (case-insensitive name)
            const { data: existingIngredients, error: fetchError } = await supabase
                .from('ingredients')
                .select('*')
                .ilike('name', normalizedName)
                .eq('unit', normalizedUnit)
                .limit(1);

            if (fetchError) throw fetchError;

            const ingredientData = {
                name: normalizedName,
                price: ingredient.price,
                unit: normalizedUnit,
                amount: ingredient.amount,
                min_amount: ingredient.minAmount || 0,
                min_amount_unit: ingredient.minAmountUnit || normalizedUnit,
                contains_amount: ingredient.containsAmount || null,
                contains_unit: ingredient.containsUnit || null,
                updated_at: new Date().toISOString()
            };

            let savedIngredient: Ingredient;

            if (existingIngredients && existingIngredients.length > 0) {
                // UPDATE existing ingredient
                const existingId = existingIngredients[0].id;
                const { data, error } = await supabase
                    .from('ingredients')
                    .update(ingredientData)
                    .eq('id', existingId)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from Supabase');

                savedIngredient = {
                    id: data.id,
                    name: data.name,
                    price: data.price,
                    unit: data.unit,
                    amount: data.amount,
                    minAmount: data.min_amount || 0,
                    minAmountUnit: data.min_amount_unit || data.unit,
                    containsAmount: data.contains_amount,
                    containsUnit: data.contains_unit
                };

                // Update the ingredientsInDatabase Set
                setIngredientsInDatabase(prev => new Set([...prev, data.id]));
            } else {
                // INSERT new ingredient
                const { data, error } = await supabase
                    .from('ingredients')
                    .insert([{
                        ...ingredientData,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from Supabase');

                savedIngredient = {
                    id: data.id,
                    name: data.name,
                    price: data.price,
                    unit: data.unit,
                    amount: data.amount,
                    minAmount: data.min_amount || 0,
                    minAmountUnit: data.min_amount_unit || data.unit,
                    containsAmount: data.contains_amount,
                    containsUnit: data.contains_unit
                };

                setIngredientsInDatabase(prev => new Set([...prev, data.id]));
            }

            // Sync state: Remove any local duplicates and add/update the saved ingredient
            setIngredients(prev => {
                const uniqueKey = `${savedIngredient.name.toLowerCase().trim()}|${savedIngredient.unit}`;
                
                // Remove any ingredients with the same name+unit (local or old DB versions)
                const filtered = prev.filter(ing => {
                    const ingKey = `${ing.name.toLowerCase().trim()}|${ing.unit}`;
                    return ingKey !== uniqueKey || ing.id === savedIngredient.id;
                });

                // Add or replace with the saved ingredient
                const existingIndex = filtered.findIndex(ing => ing.id === savedIngredient.id);
                if (existingIndex >= 0) {
                    filtered[existingIndex] = savedIngredient;
                } else {
                    filtered.push(savedIngredient);
                }

                // Sort by name
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            });

            return savedIngredient;
        } catch (error) {
            console.error('Error saving ingredient to Supabase:', error);
            throw error;
        }
    };

    // Improved deleteIngredientFromSupabase: Better state sync
    const deleteIngredientFromSupabase = async (ingredientId: string) => {
        try {
            // Only delete if it's actually in the database
            if (!ingredientsInDatabase.has(ingredientId)) {
                // If it's a local-only ingredient, just remove from state
                setIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
                return;
            }

            const { error } = await supabase
                .from('ingredients')
                .delete()
                .eq('id', ingredientId);

            if (error) throw error;

            // Remove from ingredientsInDatabase Set
            setIngredientsInDatabase(prev => {
                const newSet = new Set(prev);
                newSet.delete(ingredientId);
                return newSet;
            });

            // Remove from local state
            setIngredients(prev => prev.filter(ing => ing.id !== ingredientId));

            // Also remove from inventory if exists (use deleteInventoryFromSupabase if in DB)
            const inventoryItem = inventory.find(item => item.ingredientId === ingredientId);
            if (inventoryItem) {
                if (inventoryInDatabase.has(ingredientId)) {
                    await deleteInventoryFromSupabase(ingredientId);
                } else {
                    setInventory(prev => prev.filter(item => item.ingredientId !== ingredientId));
                }
            }
        } catch (error) {
            console.error('Failed to delete ingredient from Supabase:', error);
            throw error;
        }
    }

    // ==================== TOOLS CRUD ====================
    
    // Load tools from Supabase: Merge DB tools with local, DB takes priority
    const loadToolsFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('tools')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error;

            // Store DB tool IDs
            const dbIds = new Set<string>();
            const dbToolMap = new Map<string, Tool>(); // key: "name|category" -> Tool

            // Convert Supabase data to Tool format
            const supabaseTools: Tool[] = (data || []).map(dbTool => {
                const tool: Tool = {
                    id: dbTool.id,
                    name: dbTool.name,
                    type: dbTool.type,
                    category: dbTool.category,
                    description: dbTool.description || '',
                    lifetime: dbTool.lifetime || '',
                    totalBatches: dbTool.total_batches || 0,
                    batchesUsed: dbTool.batches_used || 0,
                    batchesPerYear: dbTool.batches_per_year || 0,
                    totalInvestment: dbTool.total_investment || 0,
                    recoveryValue: dbTool.recovery_value || 0,
                    costPerBatch: dbTool.cost_per_batch || 0
                };

                dbIds.add(dbTool.id);
                // Create unique key: name (lowercase) + category
                const uniqueKey = `${dbTool.name.toLowerCase().trim()}|${dbTool.category}`;
                dbToolMap.set(uniqueKey, tool);

                return tool;
            });

            setToolsInDatabase(dbIds);

            // Merge with local tools: DB takes priority, keep unique local-only tools
            setTools(prevTools => {
                // Filter local tools: only keep those with unique name+category not in DB
                const localOnlyTools = prevTools.filter(localTool => {
                    // Skip if already in database by ID
                    if (dbIds.has(localTool.id)) {
                        return false;
                    }

                    // Check if name+category combination exists in DB
                    const uniqueKey = `${localTool.name.toLowerCase().trim()}|${localTool.category}`;
                    return !dbToolMap.has(uniqueKey);
                });

                // Combine: DB tools (priority) + unique local-only tools
                const mergedTools = [...supabaseTools, ...localOnlyTools];

                // Sort by name for consistent display
                mergedTools.sort((a, b) => a.name.localeCompare(b.name));

                return mergedTools;
            });
        } catch (error) {
            console.error('Error loading tools from Supabase:', error);
            setError('Error al cargar herramientas de la base de datos');
        }
    }

    // Save tool to Supabase: Better duplicate detection and state sync
    const saveToolToSupabase = async (tool: Tool): Promise<Tool> => {
        try {
            // Normalize name and category for comparison
            const normalizedName = tool.name.trim();
            const normalizedCategory = tool.category.trim();

            // Check if tool exists in Supabase by name AND category (case-insensitive name)
            const { data: existingTools, error: fetchError } = await supabase
                .from('tools')
                .select('*')
                .ilike('name', normalizedName)
                .eq('category', normalizedCategory)
                .limit(1);

            if (fetchError) throw fetchError;

            const toolData = {
                name: normalizedName,
                type: tool.type,
                category: normalizedCategory,
                description: tool.description || null,
                lifetime: tool.lifetime || null,
                total_batches: tool.totalBatches || 0,
                batches_used: tool.batchesUsed || 0,
                batches_per_year: tool.batchesPerYear || 0,
                total_investment: tool.totalInvestment || 0,
                recovery_value: tool.recoveryValue || 0,
                cost_per_batch: tool.costPerBatch || 0,
                updated_at: new Date().toISOString()
            };

            let savedTool: Tool;

            if (existingTools && existingTools.length > 0) {
                // UPDATE existing tool
                const existingId = existingTools[0].id;
                const { data, error } = await supabase
                    .from('tools')
                    .update(toolData)
                    .eq('id', existingId)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from Supabase');

                savedTool = {
                    id: data.id,
                    name: data.name,
                    type: data.type,
                    category: data.category,
                    description: data.description || '',
                    lifetime: data.lifetime || '',
                    totalBatches: data.total_batches || 0,
                    batchesUsed: data.batches_used || 0,
                    batchesPerYear: data.batches_per_year || 0,
                    totalInvestment: data.total_investment || 0,
                    recoveryValue: data.recovery_value || 0,
                    costPerBatch: data.cost_per_batch || 0
                };

                setToolsInDatabase(prev => new Set([...prev, data.id]));
            } else {
                // INSERT new tool
                const { data, error } = await supabase
                    .from('tools')
                    .insert([{
                        ...toolData,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from Supabase');

                savedTool = {
                    id: data.id,
                    name: data.name,
                    type: data.type,
                    category: data.category,
                    description: data.description || '',
                    lifetime: data.lifetime || '',
                    totalBatches: data.total_batches || 0,
                    batchesUsed: data.batches_used || 0,
                    batchesPerYear: data.batches_per_year || 0,
                    totalInvestment: data.total_investment || 0,
                    recoveryValue: data.recovery_value || 0,
                    costPerBatch: data.cost_per_batch || 0
                };

                setToolsInDatabase(prev => new Set([...prev, data.id]));
            }

            // Sync state: Remove any local duplicates and add/update the saved tool
            setTools(prev => {
                const uniqueKey = `${savedTool.name.toLowerCase().trim()}|${savedTool.category}`;
                
                // Remove any tools with the same name+category (local or old DB versions)
                const filtered = prev.filter(t => {
                    const tKey = `${t.name.toLowerCase().trim()}|${t.category}`;
                    return tKey !== uniqueKey || t.id === savedTool.id;
                });

                // Add or replace with the saved tool
                const existingIndex = filtered.findIndex(t => t.id === savedTool.id);
                if (existingIndex >= 0) {
                    filtered[existingIndex] = savedTool;
                } else {
                    filtered.push(savedTool);
                }

                // Sort by name
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            });

            return savedTool;
        } catch (error) {
            console.error('Error saving tool to Supabase:', error);
            throw error;
        }
    }

    // Delete tool from Supabase: Better state sync
    const deleteToolFromSupabase = async (toolId: string) => {
        try {
            // Only delete if it's actually in the database
            if (!toolsInDatabase.has(toolId)) {
                // If it's a local-only tool, just remove from state
                setTools(prev => prev.filter(t => t.id !== toolId));
                return;
            }

            const { error } = await supabase
                .from('tools')
                .delete()
                .eq('id', toolId);

            if (error) throw error;

            // Remove from toolsInDatabase Set
            setToolsInDatabase(prev => {
                const newSet = new Set(prev);
                newSet.delete(toolId);
                return newSet;
            });

            // Remove from local state
            setTools(prev => prev.filter(t => t.id !== toolId));
        } catch (error) {
            console.error('Failed to delete tool from Supabase:', error);
            throw error;
        }
    }

    // ==================== INVENTORY CRUD ====================
    
    // Load inventory from Supabase: Merge DB inventory with local, DB takes priority
    const loadInventoryFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('*')
                .order('ingredient_id', { ascending: true })

            if (error) throw error;

            // Store DB inventory ingredient IDs
            const dbIngredientIds = new Set<string>();
            const dbInventoryMap = new Map<string, InventoryItem>(); // key: ingredientId -> InventoryItem

            // Convert Supabase data to InventoryItem format
            const supabaseInventory: InventoryItem[] = (data || []).map(dbInv => {
                const item: InventoryItem = {
                    ingredientId: dbInv.ingredient_id,
                    currentStock: dbInv.current_stock || 0,
                    unit: dbInv.unit,
                    minimumStock: dbInv.minimum_stock || 0,
                    lastUpdated: dbInv.last_updated || new Date().toISOString(),
                    costPerUnit: dbInv.cost_per_unit,
                    supplier: dbInv.supplier
                };

                dbIngredientIds.add(dbInv.ingredient_id);
                dbInventoryMap.set(dbInv.ingredient_id, item);

                return item;
            });

            setInventoryInDatabase(dbIngredientIds);

            // Merge with local inventory: DB takes priority, keep unique local-only items
            setInventory(prevInventory => {
                // Filter local inventory: only keep those with unique ingredientId not in DB
                const localOnlyInventory = prevInventory.filter(localItem => {
                    // Skip if already in database
                    return !dbIngredientIds.has(localItem.ingredientId);
                });

                // Combine: DB inventory (priority) + unique local-only inventory
                const mergedInventory = [...supabaseInventory, ...localOnlyInventory];

                return mergedInventory;
            });
        } catch (error) {
            console.error('Error loading inventory from Supabase:', error);
            setError('Error al cargar inventario de la base de datos');
        }
    }

    // Save inventory item to Supabase
    const saveInventoryToSupabase = async (item: InventoryItem): Promise<InventoryItem> => {
        try {
            const inventoryData = {
                ingredient_id: item.ingredientId,
                current_stock: item.currentStock || 0,
                unit: item.unit,
                minimum_stock: item.minimumStock || 0,
                last_updated: new Date().toISOString(),
                cost_per_unit: item.costPerUnit || null,
                supplier: item.supplier || null,
                updated_at: new Date().toISOString()
            };

            // Check if inventory item exists
            const { data: existing, error: fetchError } = await supabase
                .from('inventory')
                .select('*')
                .eq('ingredient_id', item.ingredientId)
                .limit(1);

            if (fetchError) throw fetchError;

            let savedItem: InventoryItem;

            if (existing && existing.length > 0) {
                // UPDATE existing inventory item
                const { data, error } = await supabase
                    .from('inventory')
                    .update(inventoryData)
                    .eq('ingredient_id', item.ingredientId)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from Supabase');

                savedItem = {
                    ingredientId: data.ingredient_id,
                    currentStock: data.current_stock || 0,
                    unit: data.unit,
                    minimumStock: data.minimum_stock || 0,
                    lastUpdated: data.last_updated || new Date().toISOString(),
                    costPerUnit: data.cost_per_unit,
                    supplier: data.supplier
                };

                setInventoryInDatabase(prev => new Set([...prev, data.ingredient_id]));
            } else {
                // INSERT new inventory item
                const { data, error } = await supabase
                    .from('inventory')
                    .insert([{
                        ...inventoryData,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from Supabase');

                savedItem = {
                    ingredientId: data.ingredient_id,
                    currentStock: data.current_stock || 0,
                    unit: data.unit,
                    minimumStock: data.minimum_stock || 0,
                    lastUpdated: data.last_updated || new Date().toISOString(),
                    costPerUnit: data.cost_per_unit,
                    supplier: data.supplier
                };

                setInventoryInDatabase(prev => new Set([...prev, data.ingredient_id]));
            }

            // Sync state: Update or add the saved inventory item
            setInventory(prev => {
                const existingIndex = prev.findIndex(inv => inv.ingredientId === savedItem.ingredientId);
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = savedItem;
                    return updated;
                } else {
                    return [...prev, savedItem];
                }
            });

            return savedItem;
        } catch (error) {
            console.error('Error saving inventory to Supabase:', error);
            throw error;
        }
    }

    // Delete inventory item from Supabase
    const deleteInventoryFromSupabase = async (ingredientId: string) => {
        try {
            // Only delete if it's actually in the database
            if (!inventoryInDatabase.has(ingredientId)) {
                // If it's a local-only item, just remove from state
                setInventory(prev => prev.filter(item => item.ingredientId !== ingredientId));
                return;
            }

            const { error } = await supabase
                .from('inventory')
                .delete()
                .eq('ingredient_id', ingredientId);

            if (error) throw error;

            // Remove from inventoryInDatabase Set
            setInventoryInDatabase(prev => {
                const newSet = new Set(prev);
                newSet.delete(ingredientId);
                return newSet;
            });

            // Remove from local state
            setInventory(prev => prev.filter(item => item.ingredientId !== ingredientId));
        } catch (error) {
            console.error('Failed to delete inventory from Supabase:', error);
            throw error;
        }
    }

    // ==================== INVENTORY HELPERS ====================

    // Function to add inventory item
    const addInventoryItem = async (ingredientId: string, minimumStock: number = 0) => {
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

        // If Supabase is available, save to DB
        if (saveInventoryToSupabase) {
            try {
                await saveInventoryToSupabase(newInventoryItem)
            } catch (error) {
                console.error('Failed to save inventory:', error)
                setError('Error al guardar en la base de datos. Verifica tu conexión.')
            }
        } else {
            // Local-only: update state directly
            setInventory(prev => [...prev, newInventoryItem])
        }
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
                                                className="w-full text-left flex items-center justify-between p-2 hover:bg-amber-200 rounded-lg transition-colors active:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-inset"
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
                                            className="w-full text-left flex items-center justify-between p-2 hover:bg-amber-200 rounded-lg transition-colors active:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-inset"
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
                        inventory={inventory}
                        updateInventory={updateInventory}
                        addInventoryItem={addInventoryItem}
                        saveIngredientToSupabase={saveIngredientToSupabase}
                        deleteIngredientFromSupabase={deleteIngredientFromSupabase}
                        ingredientsInDatabase={ingredientsInDatabase}
                        saveToolToSupabase={saveToolToSupabase}
                        deleteToolFromSupabase={deleteToolFromSupabase}
                        toolsInDatabase={toolsInDatabase}
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
                        inventory={inventory}
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