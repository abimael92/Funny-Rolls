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
	category?: IngredientCategory;
	allergenInfo?: string[];
}

export interface Recipe {
	id: string;
	name: string;
	ingredients: RecipeIngredient[];
	tools?: RecipeTool[];
	batchSize: number;
	sellingPrice: number;
	profitMargin: number;
	available: boolean;
	steps: string[];
	image?: string;
}

export interface RecipeIngredient {
	ingredientId: string;
	amount: number;
}

export interface CartItem extends Product {
	quantity: number;
	customizations?: string[]; // For custom orders
	specialInstructions?: string;
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

export const PRODUCTION_STATUSES = [
	'good',
	'sold',
	'bad',
	'burned',
	'damaged',
] as const;
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];

export type IngredientCategory =
	| 'flour'
	| 'sugar'
	| 'dairy'
	| 'fruit'
	| 'spice'
	| 'topping'
	| 'other';

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
	lastUpdated?: string | Date;
	costPerUnit?: number;
	supplier?: string;
}

// In your lib/types.ts
// lib/types.ts - Updated Tool interface
export interface Tool {
	id: string;
	name: string;
	type: 'consumible' | 'herramienta' | 'equipo';
	cost: number; // Cost per batch (automatically calculated for non-consumables)
	description?: string;
	category: string;
	lifetime?: string; // Estimated useful life in time
	totalBatches?: number; // Total batches expected over lifetime (calculated)
	batchesUsed?: number; // How many batches have used this tool
	recoveryValue: number; // Resale value at end of life
	totalInvestment: number; // Purchase cost
	costPerBatch?: number; // Auto-calculated: (totalInvestment - recoveryValue) / totalBatches
	yearsLifespan?: number;
}

// Add tool category configurations for batch calculations
export interface ToolCategoryConfig {
	batchesPerYear: number;
	yearsLifespan: number;
	recoveryRate: number; // Default recovery percentage if not specified
}

export const TOOL_CATEGORY_CONFIGS: Record<string, ToolCategoryConfig> = {
	// Measuring tools
	measuring: { batchesPerYear: 500, yearsLifespan: 3, recoveryRate: 0.1 },
	mixing: { batchesPerYear: 600, yearsLifespan: 2, recoveryRate: 0.05 },
	shaping: { batchesPerYear: 550, yearsLifespan: 2, recoveryRate: 0.1 },
	baking: { batchesPerYear: 450, yearsLifespan: 3, recoveryRate: 0.1 },
	cutting: { batchesPerYear: 500, yearsLifespan: 2, recoveryRate: 0.1 },
	decorating: { batchesPerYear: 400, yearsLifespan: 1, recoveryRate: 0.1 },

	// Equipment
	equipment: { batchesPerYear: 400, yearsLifespan: 5, recoveryRate: 0.1 },
	energy: { batchesPerYear: 0, yearsLifespan: 0, recoveryRate: 0 }, // Operational costs

	// Specialized
	finishing: { batchesPerYear: 300, yearsLifespan: 3, recoveryRate: 0.2 },
	professional: { batchesPerYear: 350, yearsLifespan: 4, recoveryRate: 0.15 },

	general: { batchesPerYear: 400, yearsLifespan: 3, recoveryRate: 0.1 },
};

// In your lib/types.ts
interface RecipeTool {
	toolId: string;
	usage?: 'full' | 'partial' | 'amortized'; // You can customize this
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

export interface UnitConversion {
	from: string;
	to: string;
	ratio: number;
}

export const UNIT_CONVERSIONS: UnitConversion[] = [
	{ from: 'kg', to: 'g', ratio: 1000 },
	{ from: 'g', to: 'kg', ratio: 0.001 },
	{ from: 'l', to: 'ml', ratio: 1000 },
	{ from: 'ml', to: 'l', ratio: 0.001 },
	// Add more conversions as needed
];

export interface RecipeCostBreakdown {
	totalCost: number;
	ingredientCosts: {
		ingredientId: string;
		cost: number;
		amount: number;
		unit: string;
	}[];
	profit: number;
	sellingPrice: number;
	marginPercentage: number;
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
	productionCost?: number; // Cost of ingredients used
	wasteCost?: number; // Cost of wasted/burned items
	notes?: string; // Additional notes
}

export interface Order {
	id: string;
	customerName: string;
	customerPhone: string;
	items: OrderItem[];
	total: number;
	status:
		| 'pending'
		| 'confirmed'
		| 'preparing'
		| 'ready'
		| 'completed'
		| 'cancelled';
	orderDate: string;
	pickupDate: string;
	notes?: string;
}

export interface OrderItem {
	productId: number;
	quantity: number;
	customizations?: string[];
}
