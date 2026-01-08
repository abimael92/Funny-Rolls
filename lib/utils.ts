// lib/utils.ts
import { Product, Recipe, Ingredient, Tool, RecipeTool, TOOL_CATEGORY_CONFIGS, ToolCategoryConfig } from './types';
import { products, defaultIngredients } from './data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UnitConverter } from './unit-conversion';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function calculateRecipeCost(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	// CRITICAL FIX: Prepare tools first
	const preparedTools = prepareToolsForCalculation(tools);

	// Calculate ingredient costs
	const ingredientCost = recipe.ingredients.reduce(
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

	// Calculate tool costs - USE preparedTools!
	const toolCost = (recipe.tools || []).reduce((total, recipeTool) => {
		const tool = preparedTools.find((t) => t.id === recipeTool.toolId); // <-- FIXED
		if (!tool) return total;

		return total + calculateToolCost(tool, recipeTool);
	}, 0);

	return ingredientCost + toolCost;
}

// Add this helper function to calculate tool costs properly
export function calculateToolCost(tool: Tool, recipeTool?: RecipeTool): number {
	// Ensure tool has costPerBatch calculated
	const toolWithCost = setupToolCosts(tool);

	// Get usage percentage
	const usagePercentage = getToolUsagePercentage(recipeTool);

	// Calculate base cost
	const baseCost = toolWithCost.costPerBatch || 0;

	// Apply usage percentage to ALL tool types
	return baseCost * (usagePercentage / 100);
}

export function getToolUsagePercentage(recipeTool?: RecipeTool): number {
	if (!recipeTool) return 100; // Default to full usage

	switch (recipeTool.usage) {
		case 'full':
			return 100;
		case 'partial':
			return recipeTool.usagePercentage || 50;
		case 'depreciated':
			return 0;
		default:
			return 100;
	}
}

export function setupToolCosts(
	tool: Tool,
	categoryConfig?: ToolCategoryConfig
): Tool {
	// Check if tool needs calculation
	const needsCalculation =
		!tool.costPerBatch && !tool.totalBatches && !tool.recoveryValue;

	if (!needsCalculation && tool.costPerBatch !== undefined) {
		return tool;
	}

	const config =
		categoryConfig ||
		TOOL_CATEGORY_CONFIGS[tool.category] ||
		TOOL_CATEGORY_CONFIGS.general;

	// Calculate total batches
	const totalBatches = config.batchesPerYear * config.yearsLifespan;

	// Calculate recovery value
	const recoveryValue = tool.totalInvestment * config.recoveryRate;

	// Calculate cost per batch
	const costPerBatch =
		totalBatches > 0
			? (tool.totalInvestment - recoveryValue) / totalBatches
			: 0;

	return {
		...tool,
		totalBatches: totalBatches || 1,
		recoveryValue,
		costPerBatch: costPerBatch || 0,
		batchesPerYear: config.batchesPerYear,
	};
}

export function getToolCostBreakdown(
	tool: Tool,
	recipeTool?: RecipeTool
): {
	baseCost: number;
	usagePercentage: number;
	finalCost: number;
	description: string;
} {
	const toolWithCost = setupToolCosts(tool);
	const usagePercentage = getToolUsagePercentage(recipeTool);
	const baseCost = toolWithCost.costPerBatch || 0;
	const finalCost = baseCost * (usagePercentage / 100);

	let description = 'Uso completo (100%)';
	if (recipeTool?.usage === 'partial') {
		description = `Uso parcial (${recipeTool.usagePercentage || 50}%)`;
	} else if (recipeTool?.usage === 'depreciated') {
		description = 'Depreciado (0%)';
	}

	return {
		baseCost,
		usagePercentage,
		finalCost,
		description,
	};
}

export function calculateTotalToolCost(recipe: Recipe, tools: Tool[]): number {
	const preparedTools = prepareToolsForCalculation(tools);

	return (recipe.tools || []).reduce((total, recipeTool) => {
		const tool = preparedTools.find((t) => t.id === recipeTool.toolId);
		if (!tool) return total;

		return total + calculateToolCost(tool, recipeTool);
	}, 0);
}

// Helper to ensure all tools in a list have costs calculated
export function prepareToolsForCalculation(tools: Tool[]): Tool[] {
	return tools.map(tool => setupToolCosts(tool));
}

export function calculateCostPerItem(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	// Use prepared tools
	const preparedTools = prepareToolsForCalculation(tools);
	const totalCost = calculateRecipeCost(recipe, ingredients, preparedTools);
	return recipe.batchSize > 0 ? totalCost / recipe.batchSize : 0;
}

export function calculateProfit(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	const preparedTools = prepareToolsForCalculation(tools);
	const costPerItem = calculateCostPerItem(recipe, ingredients, preparedTools);
	return recipe.sellingPrice - costPerItem;
}

export function calculateProfitPercentage(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	const preparedTools = prepareToolsForCalculation(tools);
	const costPerItem = calculateCostPerItem(recipe, ingredients, preparedTools);
	if (costPerItem === 0) return 0;
	const profit = recipe.sellingPrice - costPerItem;
	return (profit / recipe.sellingPrice) * 100;
}

// Data management helpers
export const getAllRecipes = (): Recipe[] => {
	return products.map((product) => product.recipe);
};

export const findProductByRecipeName = (
	recipeName: string
): Product | undefined => {
	return products.find((product) => product.recipe.name === recipeName);
};

export const getIngredientById = (id: string): Ingredient | undefined => {
	return defaultIngredients.find((ingredient) => ingredient.id === id);
};

export const getIngredientCostPerUnit = (ingredient: Ingredient): number => {
	// For non-standard units with conversion data
	if (ingredient.containsAmount && ingredient.containsUnit) {
		// Calculate cost per contained unit (e.g., cost per gram in a package)
		const costPerContainedUnit = ingredient.price / ingredient.containsAmount;

		// Convert 1 unit of the ingredient to the contained unit
		const standard = UnitConverter.convertToStandardUnit(1, ingredient.unit);

		const result = costPerContainedUnit * standard.value;
		return result;
	}

	// Standard calculation for regular units
	const standard = UnitConverter.convertToStandardUnit(
		ingredient.amount,
		ingredient.unit
	);

	const result = ingredient.price / standard.value;
	return result;
};

// Recipe management helpers
export const updateRecipeInProducts = (updatedRecipe: Recipe): void => {
	const productIndex = products.findIndex(
		(product) => product.recipe.id === updatedRecipe.id
	);
	if (productIndex !== -1) {
		products[productIndex].recipe = updatedRecipe;
		products[productIndex].price = updatedRecipe.sellingPrice;
		products[productIndex].available = updatedRecipe.available;
	}
};

// Local storage helpers
export const saveToLocalStorage = (key: string, data: unknown): void => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(key, JSON.stringify(data));
	}
};

export const loadFromLocalStorage = (key: string): unknown => {
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem(key);
		return saved ? JSON.parse(saved) : null;
	}
	return null;
};

// Export/Import helpers
export const exportRecipeData = (
	ingredients: Ingredient[],
	recipes: Recipe[]
): void => {
	const data = {
		ingredients,
		recipes,
		exportedAt: new Date().toISOString(),
		version: '1.0',
	};
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: 'application/json',
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `recipe-data-${new Date().toISOString().split('T')[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

export const importRecipeData = (
	file: File
): Promise<{ ingredients: Ingredient[]; recipes: Recipe[] }> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);
				if (data.ingredients && data.recipes) {
					resolve(data);
				} else {
					reject(new Error('Archivo inválido: falta ingredients o recipes'));
				}
			} catch (error) {
				reject(new Error(`Error al importar el archivo: ${error}`));
			}
		};
		reader.readAsText(file);
	});
};
