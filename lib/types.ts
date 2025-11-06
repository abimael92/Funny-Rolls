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
	minAmount: number;
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

export interface ProductionRecord {
	id: string;
	recipeId: string;
	recipeName: string;
	batchCount: number;
	date: string;
	totalProduced: number;
	items?: ProductionItem[];
	status?: ProductionStatus;
	unitPrice?: number;
}

export type ProductionStatus = 'good' | 'sold' | 'bad' | 'burned' | 'damaged';

export interface ProductionItem {
	id: string;
	status: ProductionStatus;
	quantity: number;
}

export interface InventoryItem {
	ingredientId: string;
	currentStock: number;
	unit: string;
	minimumStock: number;
}

export interface UnitInfo {
	unit: string;
	category: 'weight' | 'volume' | 'count' | 'other';
	preferredDecimals: number;
}

export interface IngredientWithConversions extends Ingredient {
	unitInfo: UnitInfo;
	compatibleUnits?: string[];
}

// Common unit configurations
export const COMMON_UNITS: UnitInfo[] = [
	// Weight units
	{ unit: 'kg', category: 'weight', preferredDecimals: 3 },
	{ unit: 'g', category: 'weight', preferredDecimals: 1 },
	{ unit: 'lb', category: 'weight', preferredDecimals: 3 },
	{ unit: 'oz', category: 'weight', preferredDecimals: 1 },

	// Volume units
	{ unit: 'l', category: 'volume', preferredDecimals: 3 },
	{ unit: 'ml', category: 'volume', preferredDecimals: 0 },
	{ unit: 'cup', category: 'volume', preferredDecimals: 2 },
	{ unit: 'tbsp', category: 'volume', preferredDecimals: 1 },
	{ unit: 'tsp', category: 'volume', preferredDecimals: 1 },

	// Count units
	{ unit: 'unidad', category: 'count', preferredDecimals: 0 },
	{ unit: 'docena', category: 'count', preferredDecimals: 1 },
	{ unit: 'paquete', category: 'count', preferredDecimals: 0 },
	{ unit: 'sobre', category: 'count', preferredDecimals: 0 },
];
