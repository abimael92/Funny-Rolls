// lib/unit-conversion.ts

import { Ingredient } from './types';

export interface UnitConversion {
	fromUnit: string;
	toUnit: string;
	conversionFactor: number;
}

export interface UnitCategory {
	name: string;
	units: string[];
	baseUnit: string;
}

export interface Measurement {
	value: number;
	unit: string;
}

// Common unit conversions
export const UNIT_CONVERSIONS: UnitConversion[] = [
	// Weight conversions
	{ fromUnit: 'kg', toUnit: 'g', conversionFactor: 1000 },
	{ fromUnit: 'g', toUnit: 'kg', conversionFactor: 0.001 },
	{ fromUnit: 'kg', toUnit: 'lb', conversionFactor: 2.20462 },
	{ fromUnit: 'lb', toUnit: 'kg', conversionFactor: 0.453592 },
	{ fromUnit: 'g', toUnit: 'oz', conversionFactor: 0.035274 },
	{ fromUnit: 'oz', toUnit: 'g', conversionFactor: 28.3495 },

	// Volume conversions
	{ fromUnit: 'l', toUnit: 'ml', conversionFactor: 1000 },
	{ fromUnit: 'ml', toUnit: 'l', conversionFactor: 0.001 },
	{ fromUnit: 'l', toUnit: 'cup', conversionFactor: 4.22675 },
	{ fromUnit: 'cup', toUnit: 'ml', conversionFactor: 236.588 },
	{ fromUnit: 'tbsp', toUnit: 'ml', conversionFactor: 14.7868 },
	{ fromUnit: 'tsp', toUnit: 'ml', conversionFactor: 4.92892 },

	// Count-based units (approximate conversions for recipe purposes)
	{ fromUnit: 'docena', toUnit: 'unidad', conversionFactor: 12 },
	{ fromUnit: 'unidad', toUnit: 'docena', conversionFactor: 1 / 12 },
	{ fromUnit: 'paquete', toUnit: 'g', conversionFactor: 250 }, // Example: 1 package = 250g
	{ fromUnit: 'sobre', toUnit: 'g', conversionFactor: 11 }, // Example: 1 packet yeast = 11g
];

// Unit categories for validation
export const UNIT_CATEGORIES: UnitCategory[] = [
	{
		name: 'weight',
		units: ['kg', 'g', 'lb', 'oz'],
		baseUnit: 'g',
	},
	{
		name: 'volume',
		units: ['l', 'ml', 'cup', 'tbsp', 'tsp'],
		baseUnit: 'ml',
	},
	{
		name: 'count',
		units: ['unidad', 'docena', 'paquete', 'sobre'],
		baseUnit: 'unidad',
	},
];

// Common ingredient densities (g/ml) for weight-volume conversions
export const INGREDIENT_DENSITIES: Record<string, number> = {
	harina: 0.57,
	azúcar: 0.85,
	'azúcar glass': 0.8,
	mantequilla: 0.96,
	aceite: 0.92,
	leche: 1.03,
	agua: 1.0,
	sal: 1.2,
	levadura: 0.6,
	cacao: 0.5,
	canela: 0.4,
	'crema para glaseado': 1.2,
	'queso crema': 1.1,
};

export const DEFAULT_UNIT_CONVERSIONS: {
	[key: string]: { amount: number; unit: string };
} = {
	botella: { amount: 1000, unit: 'ml' },
	bolsa: { amount: 1000, unit: 'g' },
	docena: { amount: 12, unit: 'unidad' },
	paquete: { amount: 500, unit: 'g' },
	sobre: { amount: 50, unit: 'g' },
	caja: { amount: 1000, unit: 'g' },
	latas: { amount: 1, unit: 'unidad' },
};

export class UnitConverter {
	/**
	 * Convert a measurement from one unit to another
	 */
	static convert(measurement: Measurement, toUnit: string): Measurement | null {
		if (measurement.unit === toUnit) {
			return measurement;
		}

		// Direct conversion
		const directConversion = UNIT_CONVERSIONS.find(
			(conv) => conv.fromUnit === measurement.unit && conv.toUnit === toUnit
		);

		if (directConversion) {
			return {
				value: measurement.value * directConversion.conversionFactor,
				unit: toUnit,
			};
		}

		// Try reverse conversion
		const reverseConversion = UNIT_CONVERSIONS.find(
			(conv) => conv.fromUnit === toUnit && conv.toUnit === measurement.unit
		);

		if (reverseConversion) {
			return {
				value: measurement.value / reverseConversion.conversionFactor,
				unit: toUnit,
			};
		}

		// Try conversion through base units
		const fromCategory = this.getUnitCategory(measurement.unit);
		const toCategory = this.getUnitCategory(toUnit);

		if (fromCategory && toCategory && fromCategory.name === toCategory.name) {
			// Convert to base unit first, then to target unit
			const toBase = this.convertToBaseUnit(measurement);
			if (toBase) {
				const fromBase = this.convertFromBaseUnit(
					{ value: toBase.value, unit: toCategory.baseUnit },
					toUnit
				);
				return fromBase;
			}
		}

		return null;
	}

	/**
	 * Convert measurement to the base unit of its category
	 */
	static convertToBaseUnit(measurement: Measurement): Measurement | null {
		const category = this.getUnitCategory(measurement.unit);
		if (!category) return null;

		if (measurement.unit === category.baseUnit) {
			return measurement;
		}

		return this.convert(measurement, category.baseUnit);
	}

	/**
	 * Convert from base unit to target unit
	 */
	static convertFromBaseUnit(
		measurement: Measurement,
		toUnit: string
	): Measurement | null {
		const category = this.getUnitCategory(toUnit);
		if (!category || measurement.unit !== category.baseUnit) return null;

		return this.convert(measurement, toUnit);
	}

	/**
	 * Get the category of a unit
	 */
	static getUnitCategory(unit: string): UnitCategory | null {
		return (
			UNIT_CATEGORIES.find((category) =>
				category.units.includes(unit.toLowerCase())
			) || null
		);
	}

	/**
	 * Convert between weight and volume using ingredient density
	 */
	static convertWeightToVolume(
		weight: Measurement,
		ingredientName: string,
		toVolumeUnit: string
	): Measurement | null {
		const density = INGREDIENT_DENSITIES[ingredientName.toLowerCase()];
		if (!density) return null;

		// Convert weight to grams first
		const weightInGrams = this.convert(weight, 'g');
		if (!weightInGrams) return null;

		// Convert grams to milliliters (volume)
		const volumeInMl = weightInGrams.value / density;

		// Convert to desired volume unit
		return this.convert({ value: volumeInMl, unit: 'ml' }, toVolumeUnit);
	}

	static convertVolumeToWeight(
		volume: Measurement,
		ingredientName: string,
		toWeightUnit: string
	): Measurement | null {
		const density = INGREDIENT_DENSITIES[ingredientName.toLowerCase()];
		if (!density) return null;

		// Convert volume to milliliters first
		const volumeInMl = this.convert(volume, 'ml');
		if (!volumeInMl) return null;

		// Convert milliliters to grams (weight)
		const weightInGrams = volumeInMl.value * density;

		// Convert to desired weight unit
		return this.convert({ value: weightInGrams, unit: 'g' }, toWeightUnit);
	}

	/**
	 * Check if two units are compatible (same category)
	 */
	static areUnitsCompatible(unit1: string, unit2: string): boolean {
		const cat1 = this.getUnitCategory(unit1);
		const cat2 = this.getUnitCategory(unit2);

		return cat1 !== null && cat2 !== null && cat1.name === cat2.name;
	}

	/**
	 * Format a measurement for display
	 */
	static formatMeasurement(
		measurement: Measurement,
		decimals: number = 2
	): string {
		const value = Number(measurement.value.toFixed(decimals));
		return `${value} ${measurement.unit}`;
	}

	/**
	 * Parse a string into a measurement
	 */
	static parseMeasurement(str: string): Measurement | null {
		const match = str.match(/^([\d.]+)\s*(\w+)$/);
		if (!match) return null;

		const value = parseFloat(match[1]);
		const unit = match[2].toLowerCase();

		if (isNaN(value)) return null;

		return { value, unit };
	}

	/**
	 * Get all compatible units for a given unit
	 */
	static getCompatibleUnits(unit: string): string[] {
		const category = this.getUnitCategory(unit);
		return category ? category.units : [];
	}

	/**
	 * Scale a measurement by a factor
	 */
	static scaleMeasurement(
		measurement: Measurement,
		factor: number
	): Measurement {
		return {
			value: measurement.value * factor,
			unit: measurement.unit,
		};
	}

	/**
	 * Add two measurements (must be same unit)
	 */
	static addMeasurements(m1: Measurement, m2: Measurement): Measurement | null {
		if (m1.unit !== m2.unit) return null;

		return {
			value: m1.value + m2.value,
			unit: m1.unit,
		};
	}

	/**
	 * Smart display conversion - shows docenas as units when amount < 1
	 */
	static convertToReadableUnit(amount: number, unit: string): string {
		// Handle docena specifically
		if (unit === 'docena' && amount < 1) {
			const individualUnits = amount * 12;
			return `${individualUnits.toFixed(0)} unidades`;
		}

		// Keep your existing conversions for other units
		if (unit === 'kg' && amount < 1) {
			const converted = this.convert({ value: amount, unit: 'kg' }, 'g');
			return converted ? `${converted.value.toFixed(0)}g` : `${amount} ${unit}`;
		}

		if ((unit === 'l' || unit === 'litro') && amount < 1) {
			const converted = this.convert({ value: amount, unit: 'l' }, 'ml');
			return converted
				? `${converted.value.toFixed(0)}ml`
				: `${amount} ${unit}`;
		}

		return `${amount} ${unit}`;
	}

	/**
	 * Convert amount to standard units for calculations
	 */
	static convertToStandardUnit(
		amount: number,
		unit: string,
		containsAmount?: number,
		containsUnit?: string
	): { value: number; unit: string } {
		// If we have package conversion data, use it
		if (
			containsAmount &&
			containsUnit &&
			[
				'botella',
				'bolsa',
				'docena',
				'paquete',
				'sobre',
				'caja',
				'latas',
			].includes(unit)
		) {
			// Convert the contained amount to standard units
			const containedStandard = this.convertToStandardUnit(
				containsAmount,
				containsUnit
			);
			return {
				value: amount * containedStandard.value,
				unit: containedStandard.unit,
			};
		}

		// Handle docena conversion for calculations
		if (unit === 'docena') {
			return { value: amount * 12, unit: 'unidad' };
		}

		// Handle other non-standard units that need conversion
		if (unit === 'paquete') {
			return { value: amount * 250, unit: 'g' };
		}

		if (unit === 'sobre') {
			return { value: amount * 11, unit: 'g' };
		}

		if (unit === 'botella') {
			return { value: amount * 1000, unit: 'ml' };
		}

		if (unit === 'bolsa') {
			return { value: amount * 1000, unit: 'g' };
		}

		if (unit === 'caja') {
			return { value: amount * 1000, unit: 'g' };
		}

		if (unit === 'latas') {
			return { value: amount * 1, unit: 'unidad' };
		}

		// For standard units, return as-is
		return { value: amount, unit };
	}

	/**
	 * Convert from standard units back to original unit for display
	 */
	static convertFromStandardUnit(
		amount: number,
		originalUnit: string
	): { value: number; unit: string } {
		if (originalUnit === 'docena') {
			return { value: amount / 12, unit: originalUnit };
		}

		if (originalUnit === 'paquete') {
			return { value: amount / 250, unit: originalUnit };
		}

		if (originalUnit === 'sobre') {
			return { value: amount / 11, unit: originalUnit };
		}

		return { value: amount, unit: originalUnit };
	}

	/**
	 * Get cost per standard unit for consistent calculations
	 */
	static getCostPerStandardUnit(ingredient: Ingredient): number {
		const standard = this.convertToStandardUnit(
			ingredient.amount,
			ingredient.unit
		);
		return ingredient.price / standard.value;
	}
}
