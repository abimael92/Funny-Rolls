// lib/utils.ts
import { Product, Recipe, Ingredient } from './types';
import { products, defaultIngredients } from './data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const calculateRecipeCost = (
	recipe: Recipe,
	ingredients: Ingredient[]
): number => {
	let totalCost = 0;
	recipe.ingredients.forEach((recipeIngredient) => {
		const ingredient = ingredients.find(
			(i) => i.id === recipeIngredient.ingredientId
		);
		if (ingredient) {
			const costPerUnit = ingredient.price / ingredient.amount;
			totalCost += costPerUnit * recipeIngredient.amount;
		}
	});
	return totalCost;
};

export const calculateCostPerItem = (
	recipe: Recipe,
	ingredients: Ingredient[]
): number => {
	const totalCost = calculateRecipeCost(recipe, ingredients);
	return totalCost / recipe.batchSize;
};

export const calculateProfit = (
	recipe: Recipe,
	ingredients: Ingredient[]
): number => {
	const costPerItem = calculateCostPerItem(recipe, ingredients);
	return recipe.sellingPrice - costPerItem;
};

export const calculateProfitPercentage = (
	recipe: Recipe,
	ingredients: Ingredient[]
): number => {
	const costPerItem = calculateCostPerItem(recipe, ingredients);
	return ((recipe.sellingPrice - costPerItem) / recipe.sellingPrice) * 100;
};

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
	return ingredient.price / ingredient.amount;
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
