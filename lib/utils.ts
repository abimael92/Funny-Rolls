// lib/utils.ts
import type { Product, Recipe, Ingredient, Tool, RecipeTool } from "./types";
import { products, defaultIngredients } from "./data";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
	recipeCost,
	costPerUnit,
	ingredientCostPerUnit,
	toolCostForRecipe,
	setupToolCosts,
	getToolCostBreakdown,
	prepareToolsForCalculation,
	calculateTotalToolCost as calcTotalToolCost,
	marginAmount,
	marginPercent,
} from "./calculations";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const calculateRecipeCost = recipeCost;
export const getIngredientCostPerUnit = ingredientCostPerUnit;

export function calculateToolCost(tool: Tool, recipeTool?: RecipeTool): number {
	return toolCostForRecipe(tool, recipeTool);
}

export { getToolUsagePercentage } from "./calculations";
export { setupToolCosts, getToolCostBreakdown, prepareToolsForCalculation };

export function calculateTotalToolCost(recipe: Recipe, tools: Tool[]): number {
	return calcTotalToolCost(recipe, tools);
}

export function calculateCostPerItem(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	return costPerUnit(recipe, ingredients, tools);
}

export function calculateProfit(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	const c = costPerUnit(recipe, ingredients, tools);
	return marginAmount(recipe.sellingPrice, c);
}

export function calculateProfitPercentage(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	const c = costPerUnit(recipe, ingredients, tools);
	return marginPercent(recipe.sellingPrice, c);
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
