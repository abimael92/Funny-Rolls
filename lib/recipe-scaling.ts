// lib/recipe-scaling.ts
import { Recipe, Ingredient } from './types';
import { UnitConverter, Measurement } from './unit-conversion';

export class RecipeScaler {
	/**
	 * Scale a recipe to a new batch size
	 */
	static scaleRecipe(
		recipe: Recipe,
		ingredients: Ingredient[],
		newBatchSize: number
	): Recipe {
		const scaleFactor = newBatchSize / recipe.batchSize;

		const scaledIngredients = recipe.ingredients.map((recipeIngredient) => {
			const ingredient = ingredients.find(
				(i) => i.id === recipeIngredient.ingredientId
			);
			if (!ingredient) return recipeIngredient;

			return {
				...recipeIngredient,
				amount: recipeIngredient.amount * scaleFactor,
			};
		});

		return {
			...recipe,
			batchSize: newBatchSize,
			ingredients: scaledIngredients,
			sellingPrice: recipe.sellingPrice * scaleFactor,
		};
	}

	/**
	 * Convert recipe to use different units where possible
	 */
	static convertRecipeUnits(
		recipe: Recipe,
		ingredients: Ingredient[],
		targetUnits: Map<string, string>
	): Recipe {
		const convertedIngredients = recipe.ingredients.map((recipeIngredient) => {
			const ingredient = ingredients.find(
				(i) => i.id === recipeIngredient.ingredientId
			);
			if (!ingredient) return recipeIngredient;

			const targetUnit = targetUnits.get(ingredient.id);
			if (!targetUnit || ingredient.unit === targetUnit)
				return recipeIngredient;

			const measurement: Measurement = {
				value: recipeIngredient.amount,
				unit: ingredient.unit,
			};

			const converted = UnitConverter.convert(measurement, targetUnit);
			if (!converted) return recipeIngredient;

			return {
				...recipeIngredient,
				amount: converted.value,
			};
		});

		return {
			...recipe,
			ingredients: convertedIngredients,
		};
	}

	/**
	 * Calculate total weight/volume of a recipe
	 */
	static calculateRecipeTotals(
		recipe: Recipe,
		ingredients: Ingredient[],
		targetUnit: string = 'g'
	): Map<string, number> {
		const totals = new Map<string, number>();

		recipe.ingredients.forEach((recipeIngredient) => {
			const ingredient = ingredients.find(
				(i) => i.id === recipeIngredient.ingredientId
			);
			if (!ingredient) return;

			const measurement: Measurement = {
				value: recipeIngredient.amount,
				unit: ingredient.unit,
			};

			const converted = UnitConverter.convert(measurement, targetUnit);
			if (converted) {
				const currentTotal = totals.get(targetUnit) || 0;
				totals.set(targetUnit, currentTotal + converted.value);
			}
		});

		return totals;
	}

	/**
	 * Check if recipe can be made with available inventory
	 */
	static checkInventory(
		recipe: Recipe,
		ingredients: Ingredient[],
		inventory: Map<string, number>
	): {
		canMake: boolean;
		missing: Array<{
			ingredient: Ingredient;
			required: number;
			available: number;
		}>;
		scaleFactor: number;
	} {
		const missing: Array<{
			ingredient: Ingredient;
			required: number;
			available: number;
		}> = [];
		let maxScaleFactor = Infinity;

		recipe.ingredients.forEach((recipeIngredient) => {
			const ingredient = ingredients.find(
				(i) => i.id === recipeIngredient.ingredientId
			);
			if (!ingredient) return;

			const available = inventory.get(ingredient.id) || 0;
			const required = recipeIngredient.amount;

			if (available < required) {
				missing.push({ ingredient, required, available });
				const possibleBatches = available / required;
				maxScaleFactor = Math.min(maxScaleFactor, possibleBatches);
			} else {
				const possibleBatches = available / required;
				maxScaleFactor = Math.min(maxScaleFactor, possibleBatches);
			}
		});

		return {
			canMake: missing.length === 0,
			missing,
			scaleFactor: Math.floor(maxScaleFactor * recipe.batchSize),
		};
	}
}
