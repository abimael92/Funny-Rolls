// lib/types.ts
// -----------------------------------------------------------------------------
// Domain models: Product, Recipe, Ingredient, Tool, Sale, SaleItem, PaymentIntent.
// Cost, price, margin, and tax are calculated centrally via lib/calculations.
// -----------------------------------------------------------------------------

export interface Ingredient {
	id: string;
	name: string;
	price: number;
	unit: string;
	amount: number;
	minAmount: number;
	minAmountUnit?: string;
	category?: IngredientCategory;
	allergenInfo?: string[];
	containsAmount?: number;
	containsUnit?: string;
}

export interface RecipeIngredient {
	ingredientId: string;
	amount: number;
}

export type ToolUsage = "full" | "partial" | "depreciated";

export interface RecipeTool {
	toolId: string;
	usage?: ToolUsage;
	usagePercentage?: number;
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

export interface CartItem extends Product {
	quantity: number;
	customizations?: string[];
	specialInstructions?: string;
}

export type SaleStatus =
	| "draft"
	| "pending"
	| "confirmed"
	| "preparing"
	| "ready"
	| "completed"
	| "cancelled";

export interface SaleItem {
	productId: number;
	productName?: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
	customizations?: string[];
	notes?: string;
}

export interface Sale {
	id: string;
	status: SaleStatus;
	items: SaleItem[];
	subtotal: number;
	taxRate: number;
	taxAmount: number;
	total: number;
	currency: string;
	createdAt: string;
	customerName?: string;
	customerPhone?: string;
	notes?: string;
}

export type PaymentIntentStatus =
	| "created"
	| "pending"
	| "succeeded"
	| "failed"
	| "cancelled";

export interface PaymentIntent {
	id: string;
	saleId: string;
	amount: number;
	currency: string;
	status: PaymentIntentStatus;
	idempotencyKey?: string;
	provider?: string;
	createdAt: string;
}

// -----------------------------------------------------------------------------
// Order (POS Phase 1 – mock-only)
// -----------------------------------------------------------------------------

export type OrderStatus = "pending" | "completed" | "cancelled";

export interface OrderItem {
	productId: number;
	productName?: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
}

export interface Order {
	id: string;
	items: OrderItem[];
	subtotal: number;
	tax: number;
	total: number;
	status: OrderStatus;
	createdAt: string;
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

export interface Tool {
	id: string;
	name: string;
	type: 'consumible' | 'herramienta' | 'equipo';
	category: string; // Maps to a ToolCategoryConfig
	description?: string;
	lifetime?: string; // Text for UI, e.g., "2 años"
	totalBatches?: number; // batchesPerYear * yearsLifespan
	batchesUsed?: number;
	batchesPerYear?: number;
	totalInvestment: number;
	recoveryValue: number; // totalInvestment * recoveryRate
	costPerBatch?: number; // (totalInvestment - recoveryValue) / totalBatches
}

// Add tool category configurations for batch calculations
export interface ToolCategoryConfig {
	batchesPerYear: number; // How many times the tool can be used per year
	yearsLifespan: number; // How many years it will last
	recoveryRate: number; // % of total investment you can recover at end of life
}

export const TOOL_CATEGORY_CONFIGS: Record<string, ToolCategoryConfig> = {
	// Measuring tools (light, precise)
	measuring: { batchesPerYear: 200, yearsLifespan: 3, recoveryRate: 0.1 }, // e.g., tazas, básculas

	// Mixing tools (medium use)
	mixing: { batchesPerYear: 400, yearsLifespan: 2, recoveryRate: 0.05 }, // bowls, batidores

	// Shaping tools (medium use)
	shaping: { batchesPerYear: 300, yearsLifespan: 2, recoveryRate: 0.1 }, // rodillos

	// Baking tools (medium-heavy use)
	baking: { batchesPerYear: 450, yearsLifespan: 3, recoveryRate: 0.1 }, // moldes

	// Cutting tools (light-medium use)
	cutting: { batchesPerYear: 250, yearsLifespan: 2, recoveryRate: 0.1 }, // cuchillos

	// Decorating tools (low use, fragile)
	decorating: { batchesPerYear: 150, yearsLifespan: 1, recoveryRate: 0.1 }, // mangas, decor tools

	// Equipment (heavy use, long lifespan)
	equipment: { batchesPerYear: 500, yearsLifespan: 5, recoveryRate: 0.8 }, // horno, estufa, industrial mixers

	// Energy/operational (not amortized)
	energy: { batchesPerYear: 0, yearsLifespan: 0, recoveryRate: 0 }, // consumables, utilities

	// Specialized / professional tools
	finishing: { batchesPerYear: 300, yearsLifespan: 3, recoveryRate: 0.2 }, // caramelizing, finishing tools
	professional: { batchesPerYear: 350, yearsLifespan: 4, recoveryRate: 0.15 }, // advanced measurement kits

	// Default fallback
	general: { batchesPerYear: 400, yearsLifespan: 3, recoveryRate: 0.1 },
	// Aliases used by mock tools (data.ts)
	medicion: { batchesPerYear: 200, yearsLifespan: 3, recoveryRate: 0.1 },
	mezcla: { batchesPerYear: 400, yearsLifespan: 2, recoveryRate: 0.05 },
	electrodomestico: { batchesPerYear: 500, yearsLifespan: 5, recoveryRate: 0.1 },
	cocina: { batchesPerYear: 300, yearsLifespan: 3, recoveryRate: 0.1 },
};

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



