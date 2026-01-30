/**
 * Centralized calculations for cost, price, margin, and tax.
 * Single source of truth; all domain logic imports from here.
 */

import type { Ingredient, Recipe, RecipeTool, Tool } from "./types";
import { TOOL_CATEGORY_CONFIGS } from "./types";
import { UnitConverter } from "./unit-conversion";

/** Default tax rate (e.g. 16% Mexico). Applied to sale subtotal. */
export const DEFAULT_TAX_RATE = 0.16;

/** Currency for amounts. */
export const DEFAULT_CURRENCY = "MXN";

// ----- Ingredient cost -----

/**
 * Cost per single unit of an ingredient (e.g. per kg, per docena).
 * Uses containsAmount/containsUnit when present for non-standard units.
 */
export function ingredientCostPerUnit(ingredient: Ingredient): number {
	if (ingredient.containsAmount != null && ingredient.containsUnit) {
		const costPerContained = ingredient.price / ingredient.containsAmount;
		const std = UnitConverter.convertToStandardUnit(
			1,
			ingredient.unit,
			ingredient.containsAmount,
			ingredient.containsUnit
		);
		return costPerContained * std.value;
	}
	const std = UnitConverter.convertToStandardUnit(
		ingredient.amount,
		ingredient.unit
	);
	return ingredient.price / std.value;
}

// ----- Tool cost -----

export function getToolUsagePercentage(rt?: RecipeTool): number {
	if (!rt) return 100;
	switch (rt.usage) {
		case "full":
			return 100;
		case "partial":
			return rt.usagePercentage ?? 50;
		case "depreciated":
			return 0;
		default:
			return 100;
	}
}

function toolCostPerBatch(tool: Tool): number {
	const cfg =
		TOOL_CATEGORY_CONFIGS[tool.category] ?? TOOL_CATEGORY_CONFIGS.general;
	const totalBatches = cfg.batchesPerYear * cfg.yearsLifespan;
	const recovery = tool.totalInvestment * cfg.recoveryRate;
	if (totalBatches <= 0) return 0;
	return (tool.totalInvestment - recovery) / totalBatches;
}

/**
 * Tool cost applied to a recipe batch (usage % applied).
 */
export function toolCostForRecipe(tool: Tool, recipeTool?: RecipeTool): number {
	const base = tool.costPerBatch ?? toolCostPerBatch(tool);
	return (base * getToolUsagePercentage(recipeTool)) / 100;
}

export interface ToolCostBreakdown {
	baseCost: number;
	usagePercentage: number;
	finalCost: number;
	description: string;
}

/**
 * Breakdown of tool cost for a recipe (base, usage %, final).
 */
export function getToolCostBreakdown(
	tool: Tool,
	recipeTool?: RecipeTool
): ToolCostBreakdown {
	const base = tool.costPerBatch ?? toolCostPerBatch(tool);
	const pct = getToolUsagePercentage(recipeTool);
	const finalCost = (base * pct) / 100;
	let description = "Uso completo (100%)";
	if (recipeTool?.usage === "partial") {
		description = `Uso parcial (${recipeTool.usagePercentage ?? 50}%)`;
	} else if (recipeTool?.usage === "depreciated") {
		description = "Depreciado (0%)";
	}
	return { baseCost: base, usagePercentage: pct, finalCost, description };
}

/**
 * Return tool with costPerBatch, totalBatches, recoveryValue set from config.
 */
export function setupToolCosts(tool: Tool): Tool {
	const cfg =
		TOOL_CATEGORY_CONFIGS[tool.category] ?? TOOL_CATEGORY_CONFIGS.general;
	const totalBatches = cfg.batchesPerYear * cfg.yearsLifespan;
	const recovery = tool.totalInvestment * cfg.recoveryRate;
	const costPerBatch =
		totalBatches > 0 ? (tool.totalInvestment - recovery) / totalBatches : 0;
	return {
		...tool,
		totalBatches: totalBatches || 1,
		recoveryValue: recovery,
		costPerBatch: costPerBatch || 0,
		batchesPerYear: cfg.batchesPerYear,
	};
}

/**
 * Tools with costs computed; use for recipe cost calculations.
 */
export function prepareToolsForCalculation(tools: Tool[]): Tool[] {
	return tools.map(setupToolCosts);
}

/**
 * Total tool cost for a recipe batch.
 */
export function calculateTotalToolCost(
	recipe: Recipe,
	tools: Tool[] = []
): number {
	const prepared = prepareToolsForCalculation(tools);
	return (recipe.tools ?? []).reduce(
		(sum, rt) => {
			const t = prepared.find((x) => x.id === rt.toolId);
			return t ? sum + toolCostForRecipe(t, rt) : sum;
		},
		0
	);
}

// ----- Recipe cost -----

/**
 * Total cost for one batch of a recipe (ingredients + tools).
 */
export function recipeCost(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	const ingCost = recipe.ingredients.reduce((sum, ri) => {
		const ing = ingredients.find((i) => i.id === ri.ingredientId);
		return ing
			? sum + ingredientCostPerUnit(ing) * ri.amount
			: sum;
	}, 0);
	const tlCost = (recipe.tools ?? []).reduce((sum, rt) => {
		const t = tools.find((x) => x.id === rt.toolId);
		return t ? sum + toolCostForRecipe(t, rt) : sum;
	}, 0);
	return ingCost + tlCost;
}

/**
 * Cost per sellable unit (batch cost / batch size).
 */
export function costPerUnit(
	recipe: Recipe,
	ingredients: Ingredient[],
	tools: Tool[] = []
): number {
	const total = recipeCost(recipe, ingredients, tools);
	return recipe.batchSize > 0 ? total / recipe.batchSize : 0;
}

// ----- Price, margin, tax -----

/**
 * Margin amount: unitPrice - unitCost.
 */
export function marginAmount(unitPrice: number, unitCost: number): number {
	return unitPrice - unitCost;
}

/**
 * Margin as percentage of selling price: (unitPrice - unitCost) / unitPrice.
 */
export function marginPercent(unitPrice: number, unitCost: number): number {
	if (unitPrice <= 0) return 0;
	return (marginAmount(unitPrice, unitCost) / unitPrice) * 100;
}

/**
 * Tax amount from subtotal and rate (e.g. 0.16 for 16%).
 */
export function taxAmount(subtotal: number, rate: number = DEFAULT_TAX_RATE): number {
	return subtotal * rate;
}

/**
 * Total including tax: subtotal + taxAmount(subtotal, rate).
 */
export function totalWithTax(
	subtotal: number,
	rate: number = DEFAULT_TAX_RATE
): number {
	return subtotal + taxAmount(subtotal, rate);
}

/**
 * Line total for a sale item: quantity * unitPrice.
 */
export function lineTotal(quantity: number, unitPrice: number): number {
	return quantity * unitPrice;
}

/** Minimal item shape for subtotal calculation. */
export interface SaleItemLike {
	quantity: number;
	unitPrice: number;
}

/**
 * Sale subtotal from items (sum of line totals).
 */
export function saleSubtotalFromItems(items: SaleItemLike[]): number {
	return items.reduce((s, i) => s + lineTotal(i.quantity, i.unitPrice), 0);
}

/**
 * Sale tax from subtotal and optional rate.
 */
export function saleTaxFromSubtotal(
	subtotal: number,
	rate: number = DEFAULT_TAX_RATE
): number {
	return taxAmount(subtotal, rate);
}

/**
 * Sale total (subtotal + tax) from subtotal and optional rate.
 */
export function saleTotalFromSubtotal(
	subtotal: number,
	rate: number = DEFAULT_TAX_RATE
): number {
	return totalWithTax(subtotal, rate);
}
