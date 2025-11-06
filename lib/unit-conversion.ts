// lib/unit-conversion.ts

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
}
