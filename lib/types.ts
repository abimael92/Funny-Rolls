// lib/types.ts
export interface Product {
	id: number;
	name: string;
	price: number;
	image: string;
	description: string;
	rating: number;
	available: boolean;
	recipe: Recipe;
}

export interface Ingredient {
	id: string;
	name: string;
	price: number;
	unit: string;
	amount: number;
}

export interface Recipe {
	id: string;
	name: string;
	ingredients: RecipeIngredient[];
	batchSize: number;
	sellingPrice: number;
	profitMargin: number;
	available: boolean;
	steps: string[];
}

export interface RecipeIngredient {
	ingredientId: string;
	amount: number;
}

export interface CartItem extends Product {
	quantity: number;
}
