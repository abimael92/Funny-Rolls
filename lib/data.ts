// lib/data.ts
import { Product, Ingredient, Tool } from './types';

// lib/data.ts
export const defaultIngredients: Ingredient[] = [
	{ id: '1', name: 'Harina', price: 25, unit: 'kg', amount: 1, minAmount: 0.8 },
	{ id: '2', name: 'Azúcar', price: 18, unit: 'kg', amount: 1, minAmount: 0.2 },
	{
		id: '3',
		name: 'Mantequilla',
		price: 120,
		unit: 'kg',
		amount: 1,
		minAmount: 0.15,
	},
	{
		id: '4',
		name: 'Canela',
		price: 200,
		unit: 'kg',
		amount: 1,
		minAmount: 0.03,
	},
	{
		id: '5',
		name: 'Levadura',
		price: 45,
		unit: 'kg',
		amount: 1,
		minAmount: 0.03,
	},

	// Non-standard units with conversion data
	{
		id: '6',
		name: 'Huevos',
		price: 45,
		unit: 'docena',
		amount: 1,
		minAmount: 0.3,
		containsAmount: 12, // 1 dozen contains 12 units
		containsUnit: 'unidad', // The contained unit is individual units
	},
	{
		id: '7',
		name: 'Leche',
		price: 25,
		unit: 'litro',
		amount: 1,
		minAmount: 0.3,
		// No conversion needed for standard metric units
	},

	// Add more non-standard units as needed
	{
		id: '16',
		name: 'Levadura en sobre',
		price: 15,
		unit: 'sobre',
		amount: 1,
		minAmount: 5,
		containsAmount: 11, // 1 packet contains 11g
		containsUnit: 'g', // The contained unit is grams
	},
	{
		id: '17',
		name: 'Harina en paquete',
		price: 18,
		unit: 'paquete',
		amount: 1,
		minAmount: 2,
		containsAmount: 1000, // 1 package contains 1000g
		containsUnit: 'g', // The contained unit is grams
	},
	{
		id: '18',
		name: 'Botella de esencia',
		price: 180,
		unit: 'botella',
		amount: 1,
		minAmount: 0.1,
		containsAmount: 500, // 1 bottle contains 500ml
		containsUnit: 'ml', // The contained unit is milliliters
	},
	{
		id: '19',
		name: 'Bolsa de chocolate',
		price: 85,
		unit: 'bolsa',
		amount: 1,
		minAmount: 1,
		containsAmount: 500, // 1 bag contains 500g
		containsUnit: 'g', // The contained unit is grams
	},
	{
		id: '20',
		name: 'Caja de fresas',
		price: 120,
		unit: 'caja',
		amount: 1,
		minAmount: 0.5,
		containsAmount: 2000, // 1 box contains 2000g
		containsUnit: 'g', // The contained unit is grams
	},
	{
		id: '21',
		name: 'Latas de leche condensada',
		price: 35,
		unit: 'latas',
		amount: 1,
		minAmount: 3,
		containsAmount: 1, // 1 can = 1 unit (or you could use weight)
		containsUnit: 'unidad', // The contained unit is individual cans
	},
];

export const products: Product[] = [
	{
		id: 1,
		name: 'Roll Clásico Risueño',
		price: 50,
		image: '/img/classic-cinnamon-roll-with-icing.png',
		description:
			'Nuestro rollo de canela emblemático que te hará reír de alegría',
		rating: 5,
		available: true,
		recipe: {
			id: '1',
			name: 'Roll Clásico Risueño',
			batchSize: 12,
			sellingPrice: 50,
			profitMargin: 60,
			available: true,
			ingredients: [
				{ ingredientId: '1', amount: 1 },
				{ ingredientId: '2', amount: 0.3 },
				{ ingredientId: '3', amount: 0.25 },
				{ ingredientId: '4', amount: 0.05 },
				{ ingredientId: '5', amount: 0.05 },
				{ ingredientId: '6', amount: 0.5 },
				{ ingredientId: '7', amount: 0.5 },
				{ ingredientId: '8', amount: 0.2 },
				{ ingredientId: '14', amount: 0.02 },
				{ ingredientId: '15', amount: 0.01 },
			],
			tools: [
				{ toolId: 'util-1', usage: 'full' }, // Horno
				{ toolId: 'util-3', usage: 'full' }, // Mezcladora
				{ toolId: 'uten-1', usage: 'full' }, // Juego de Medidores
				{ toolId: 'uten-2', usage: 'full' }, // Báscula Digital
				{ toolId: 'uten-3', usage: 'full' }, // Bowls Mezcladores
				{ toolId: 'uten-6', usage: 'full' }, // Rodillo para Masa
				{ toolId: 'uten-7', usage: 'full' }, // Moldes para Hornear
				{ toolId: 'uten-8', usage: 'full' }, // Cuchillo de Sierra
			],
			steps: [
				'Mezclar harina, azúcar, levadura y sal en un bowl grande',
				'Agregar mantequilla derretida y huevos batidos',
				'Incorporar leche tibia poco a poco mientras se amasa',
				'Amasar por 10 minutos hasta obtener una masa suave',
				'Dejar reposar en lugar tibio por 1 hora hasta que duplique su tamaño',
				'Extender la masa en rectángulo de 40x30 cm',
				'Espolvorear canela y azúcar uniformemente',
				'Enrollar firmemente desde el lado largo',
				'Cortar en 12 porciones iguales',
				'Colocar en molde engrasado y dejar reposar 30 minutos',
				'Hornear a 180°C por 25-30 minutos hasta dorar',
				'Dejar enfriar y decorar con glaseado de crema',
			],
		},
	},
	{
		id: 2,
		name: 'Roll de Choco Risas',
		price: 65,
		image: '/img/chocolate-cinnamon-roll-with-chocolate-drizzle.png',
		description: 'Doble chocolate delicioso que es seriamente divertido',
		rating: 5,
		available: false,
		recipe: {
			id: '2',
			name: 'Roll de Choco Risas',
			batchSize: 12,
			sellingPrice: 65,
			profitMargin: 65,
			available: true,
			ingredients: [
				{ ingredientId: '1', amount: 1 },
				{ ingredientId: '2', amount: 0.4 },
				{ ingredientId: '3', amount: 0.3 },
				{ ingredientId: '9', amount: 0.3 },
				{ ingredientId: '5', amount: 0.05 },
				{ ingredientId: '6', amount: 0.5 },
				{ ingredientId: '7', amount: 0.5 },
				{ ingredientId: '14', amount: 0.02 },
				{ ingredientId: '15', amount: 0.01 },
			],
			tools: [
				{ toolId: 'util-1', usage: 'full' }, // Horno
				{ toolId: 'util-2', usage: 'partial' }, // Estufa (para chocolate)
				{ toolId: 'util-3', usage: 'full' }, // Mezcladora
				{ toolId: 'uten-1', usage: 'full' }, // Juego de Medidores
				{ toolId: 'uten-2', usage: 'full' }, // Báscula Digital
				{ toolId: 'uten-3', usage: 'full' }, // Bowls Mezcladores
				{ toolId: 'uten-6', usage: 'full' }, // Rodillo para Masa
				{ toolId: 'uten-7', usage: 'full' }, // Moldes para Hornear
				{ toolId: 'enh-4', usage: 'full' }, // Manga Pastelera (para chocolate)
			],
			steps: [
				'Mezclar harina, cacao en polvo, azúcar y levadura',
				'Agregar mantequilla, huevos y esencia de vainilla',
				'Incorporar leche tibia gradualmente mientras se amasa',
				'Amasar hasta obtener consistencia elástica',
				'Reposar 1 hora en lugar tibio cubierto',
				'Extender masa y esparcir chips de chocolate',
				'Enrollar cuidadosamente y cortar en 12 porciones',
				'Colocar en molde y reposar 30 minutos más',
				'Hornear a 175°C por 30-35 minutos',
				'Preparar salsa de chocolate para bañar',
				'Decorar con chocolate derretido y chips',
			],
		},
	},
	{
		id: 3,
		name: 'Remolino de Fresa',
		price: 60,
		image: '/img/strawberry-cinnamon-roll-with-pink-icing.png',
		description: 'Giro dulce de fresa que te hará sonreír',
		rating: 4.8,
		available: true,
		recipe: {
			id: '3',
			name: 'Remolino de Fresa',
			batchSize: 12,
			sellingPrice: 60,
			profitMargin: 62,
			available: true,
			ingredients: [
				{ ingredientId: '1', amount: 1 },
				{ ingredientId: '2', amount: 0.35 },
				{ ingredientId: '3', amount: 0.25 },
				{ ingredientId: '10', amount: 0.4 },
				{ ingredientId: '5', amount: 0.05 },
				{ ingredientId: '6', amount: 0.5 },
				{ ingredientId: '7', amount: 0.5 },
				{ ingredientId: '13', amount: 0.15 },
				{ ingredientId: '14', amount: 0.02 },
			],
			tools: [
				{ toolId: 'util-1', usage: 'full' }, // Horno
				{ toolId: 'util-3', usage: 'full' }, // Mezcladora
				{ toolId: 'uten-1', usage: 'full' }, // Juego de Medidores
				{ toolId: 'uten-2', usage: 'full' }, // Báscula Digital
				{ toolId: 'uten-3', usage: 'full' }, // Bowls Mezcladores
				{ toolId: 'uten-4', usage: 'partial' }, // Batidor (para queso crema)
				{ toolId: 'uten-6', usage: 'full' }, // Rodillo para Masa
				{ toolId: 'uten-7', usage: 'full' }, // Moldes para Hornear
				{ toolId: 'uten-8', usage: 'full' }, // Cuchillo de Sierra
				{ toolId: 'enh-4', usage: 'full' }, // Manga Pastelera (para glaseado rosa)
			],
			steps: [
				'Preparar puré de fresas frescas',
				'Mezclar harina, azúcar y levadura',
				'Incorporar puré de fresa, mantequilla y huevos',
				'Amasar hasta que la masa no se pegue',
				'Dejar levar por 1 hora en lugar cálido',
				'Extender masa y esparcir mermelada de fresa',
				'Enrollar firmemente y cortar en porciones',
				'Disponer en molde y reposar 25 minutos',
				'Hornear a 180°C por 25 minutos',
				'Preparar glaseado rosa con queso crema',
				'Decorar con fresas frescas en rodajas',
			],
		},
	},
	{
		id: 4,
		name: 'Arándano en Verano',
		price: 65,
		image: '/img/blueberry-cinnamon-roll-with-cream-cheese-icing.png',
		description: 'Repleto de arándanos y risas',
		rating: 4.9,
		available: false,
		recipe: {
			id: '4',
			name: 'Arándano en Verano',
			batchSize: 12,
			sellingPrice: 65,
			profitMargin: 63,
			available: true,
			ingredients: [
				{ ingredientId: '1', amount: 1 },
				{ ingredientId: '2', amount: 0.35 },
				{ ingredientId: '3', amount: 0.25 },
				{ ingredientId: '11', amount: 0.35 },
				{ ingredientId: '5', amount: 0.05 },
				{ ingredientId: '6', amount: 0.5 },
				{ ingredientId: '7', amount: 0.5 },
				{ ingredientId: '13', amount: 0.2 },
				{ ingredientId: '14', amount: 0.02 },
				{ ingredientId: '4', amount: 0.03 },
			],
			tools: [
				{ toolId: 'util-1', usage: 'full' }, // Horno
				{ toolId: 'util-3', usage: 'full' }, // Mezcladora
				{ toolId: 'uten-1', usage: 'full' }, // Juego de Medidores
				{ toolId: 'uten-2', usage: 'full' }, // Báscula Digital
				{ toolId: 'uten-3', usage: 'full' }, // Bowls Mezcladores
				{ toolId: 'uten-4', usage: 'partial' }, // Batidor (para queso crema)
				{ toolId: 'uten-6', usage: 'full' }, // Rodillo para Masa
				{ toolId: 'uten-7', usage: 'full' }, // Moldes para Hornear
				{ toolId: 'uten-8', usage: 'full' }, // Cuchillo de Sierra
				{ toolId: 'enh-4', usage: 'full' }, // Manga Pastelera
			],
			steps: [
				'Mezclar harina, azúcar, levadura y canela',
				'Agregar mantequilla, huevos y leche tibia',
				'Amasar hasta obtener masa homogénea',
				'Dejar reposar 1 hora hasta que doble tamaño',
				'Extender masa y distribuir arándanos frescos',
				'Espolvorear azúcar morena y canela',
				'Enrollar cuidadosamente para no aplastar frutas',
				'Cortar en 12 rollos y colocar en molde',
				'Reposar 30 minutos hasta que esponjen',
				'Hornear a 175°C por 28-32 minutos',
				'Preparar glaseado de queso crema con esencia de vainilla',
				'Decorar con arándanos frescos y glaseado',
			],
		},
	},
	{
		id: 5,
		name: 'Glaseado Divertido',
		price: 45,
		image: '/img/glazed-cinnamon-roll-with-sugar-glaze.png',
		description: 'Simple, dulce y garantizado para hacerte reír',
		rating: 4.7,
		available: true,
		recipe: {
			id: '5',
			name: 'Glaseado Divertido',
			batchSize: 12,
			sellingPrice: 45,
			profitMargin: 55,
			available: true,
			ingredients: [
				{ ingredientId: '1', amount: 1 },
				{ ingredientId: '2', amount: 0.4 },
				{ ingredientId: '3', amount: 0.2 },
				{ ingredientId: '4', amount: 0.04 },
				{ ingredientId: '5', amount: 0.05 },
				{ ingredientId: '6', amount: 0.4 },
				{ ingredientId: '7', amount: 0.45 },
				{ ingredientId: '8', amount: 0.25 },
				{ ingredientId: '14', amount: 0.015 },
			],
			tools: [
				{ toolId: 'util-1', usage: 'full' }, // Horno
				{ toolId: 'util-3', usage: 'full' }, // Mezcladora
				{ toolId: 'uten-1', usage: 'full' }, // Juego de Medidores
				{ toolId: 'uten-2', usage: 'full' }, // Báscula Digital
				{ toolId: 'uten-3', usage: 'full' }, // Bowls Mezcladores
				{ toolId: 'uten-5', usage: 'partial' }, // Espátula (para glaseado)
				{ toolId: 'uten-6', usage: 'full' }, // Rodillo para Masa
				{ toolId: 'uten-7', usage: 'full' }, // Moldes para Hornear
				{ toolId: 'uten-8', usage: 'full' }, // Cuchillo de Sierra
			],
			steps: [
				'Combinar harina, azúcar, levadura y sal',
				'Incorporar mantequilla ablandada y huevos',
				'Añadir leche tibia gradualmente mientras se mezcla',
				'Amasar por 8-10 minutos hasta suavidad',
				'Dejar levar 45 minutos en lugar tibio',
				'Extender masa en rectángulo uniforme',
				'Esparcir mezcla de canela y azúcar',
				'Enrollar firmemente y cortar en 12 piezas',
				'Colocar en molde y reposar 20 minutos',
				'Hornear a 180°C por 20-25 minutos',
				'Preparar glaseado simple con azúcar glass y leche',
				'Bañar los rollos calientes con glaseado generosamente',
			],
		},
	},
	{
		id: 6,
		name: 'Caramelo Crujiente',
		price: 70,
		image: '/img/caramel-cinnamon-roll-with-crunchy-topping.png',
		description: 'Delicioso caramelo crujiente que te hará reír a carcajadas',
		rating: 5,
		available: false,
		recipe: {
			id: '6',
			name: 'Caramelo Crujiente',
			batchSize: 12,
			sellingPrice: 70,
			profitMargin: 68,
			available: true,
			ingredients: [
				{ ingredientId: '1', amount: 1 },
				{ ingredientId: '2', amount: 0.35 },
				{ ingredientId: '3', amount: 0.3 },
				{ ingredientId: '12', amount: 0.25 },
				{ ingredientId: '4', amount: 0.04 },
				{ ingredientId: '5', amount: 0.05 },
				{ ingredientId: '6', amount: 0.5 },
				{ ingredientId: '7', amount: 0.5 },
				{ ingredientId: '13', amount: 0.18 },
				{ ingredientId: '14', amount: 0.02 },
			],
			tools: [
				{ toolId: 'util-1', usage: 'full' }, // Horno
				{ toolId: 'util-2', usage: 'partial' }, // Estufa (para caramelo)
				{ toolId: 'util-3', usage: 'full' }, // Mezcladora
				{ toolId: 'uten-1', usage: 'full' }, // Juego de Medidores
				{ toolId: 'uten-2', usage: 'full' }, // Báscula Digital
				{ toolId: 'uten-3', usage: 'full' }, // Bowls Mezcladores
				{ toolId: 'uten-6', usage: 'full' }, // Rodillo para Masa
				{ toolId: 'uten-7', usage: 'full' }, // Moldes para Hornear
				{ toolId: 'enh-3', usage: 'partial' }, // Soplete (para acabado caramelizado)
				{ toolId: 'enh-4', usage: 'full' }, // Manga Pastelera
			],
			steps: [
				'Preparar base con harina, azúcar y levadura',
				'Agregar mantequilla, huevos y leche',
				'Amasar hasta lograr textura sedosa',
				'Dejar reposar 1 hora hasta que leve',
				'Extender masa y esparcir caramelo suave',
				'Agregar nueces picadas para crujiente (opcional)',
				'Enrollar cuidadosamente y cortar en porciones',
				'Colocar en molde con base de caramelo',
				'Dejar reposar 25 minutos hasta esponjar',
				'Hornear a 170°C por 30-35 minutos',
				'Dejar enfriar 5 minutos antes de desmoldar',
				'Decorar con salsa de caramelo y nueces caramelizadas',
			],
		},
	},
];

export const defaultTools: Tool[] = [
	// ----------------------------
	// UTILITIES (equipo / electrodoméstico)
	// Heavy-duty machines, long-lasting, used many batches per year
	// ----------------------------
	{
		id: 'util-1',
		name: 'Horno',
		type: 'equipo', // Durable equipment
		category: 'electrodomestico',
		totalInvestment: 2000, // Purchase price
		lifetime: '5 años', // Expected useful life
		batchesPerYear: 300, // Estimated batches this horno can handle per year
		totalBatches: 300 * 5, // lifetime * batches/year
		recoveryValue: 200, // Resale at end of life (~10% of investment)
		costPerBatch: (2000 - 200) / (300 * 5), // Amortized cost per batch
		// yearUsage same as batchesPerYear for calculation
	},
	{
		id: 'util-2',
		name: 'Estufa',
		type: 'equipo',
		category: 'electrodomestico',
		totalInvestment: 1500,
		lifetime: '5 años',
		batchesPerYear: 300,
		totalBatches: 300 * 5,
		recoveryValue: 150,
		costPerBatch: (1500 - 150) / (300 * 5),
	},
	{
		id: 'util-3',
		name: 'Mezcladora',
		type: 'equipo',
		category: 'electrodomestico',
		totalInvestment: 800,
		lifetime: '3 años',
		batchesPerYear: 250,
		totalBatches: 250 * 3,
		recoveryValue: 80,
		costPerBatch: (800 - 80) / (250 * 3),
	},

	// ----------------------------
	// TOOLS (herramienta)
	// Small tools, limited use per year, moderate recovery
	// ----------------------------
	{
		id: 'uten-1',
		name: 'Juego de Medidores',
		type: 'herramienta',
		category: 'medicion',
		totalInvestment: 150,
		lifetime: '2 años',
		batchesPerYear: 250, // moderate use
		totalBatches: 250 * 2,
		recoveryValue: 15, // ~10% resale
		costPerBatch: (150 - 15) / (250 * 2),
	},
	{
		id: 'uten-2',
		name: 'Báscula Digital',
		type: 'herramienta',
		category: 'medicion',
		totalInvestment: 250,
		lifetime: '3 años',
		batchesPerYear: 300,
		totalBatches: 300 * 3,
		recoveryValue: 25, // ~10% resale
		costPerBatch: (250 - 25) / (300 * 3),
	},
	{
		id: 'uten-3',
		name: 'Bowls Mezcladores',
		type: 'herramienta',
		category: 'mezcla',
		totalInvestment: 100,
		lifetime: '2 años',
		batchesPerYear: 200,
		totalBatches: 200 * 2,
		recoveryValue: 10,
		costPerBatch: (100 - 10) / (200 * 2),
	},
	{
		id: 'uten-4',
		name: 'Batidor de Alambre',
		type: 'herramienta',
		category: 'mixing',
		totalInvestment: 50,
		lifetime: '1.5 años',
		batchesPerYear: 150,
		totalBatches: Math.ceil(150 * 1.5), // round up for partial year
		recoveryValue: 5,
		costPerBatch: (50 - 5) / Math.ceil(150 * 1.5),
	},

	// ----------------------------
	// SPECIALIZED / HIGH-END
	// Professional equipment, high investment, fewer batches per year
	// ----------------------------
	{
		id: 'enh-1',
		name: 'Mezcladora Planetaria',
		type: 'equipo',
		category: 'electrodomestico',
		totalInvestment: 2000,
		lifetime: '5 años',
		batchesPerYear: 300, // heavy use but less than small tools
		totalBatches: 300 * 5,
		recoveryValue: 200,
		costPerBatch: (2000 - 200) / (300 * 5),
	},
	{
		id: 'enh-3',
		name: 'Soplete Culinario',
		type: 'herramienta',
		category: 'cocina',
		totalInvestment: 400,
		lifetime: '3 años',
		batchesPerYear: 150, // specialized, limited use
		totalBatches: 150 * 3,
		recoveryValue: 40,
		costPerBatch: (400 - 40) / (150 * 3),
	},
];

export const toolCategories = {
	consumible: [
		{ value: 'general', label: 'General' },
		{ value: 'empaque', label: 'Empaque' },
		{ value: 'limpieza', label: 'Limpieza' },
	],
	herramienta: [
		{ value: 'general', label: 'General' },
		{ value: 'cocina', label: 'Cocina' },
		{ value: 'medicion', label: 'Medición' },
		{ value: 'mezcla', label: 'Mezcla' },
		{ value: 'moldeo', label: 'Moldeo' },
		{ value: 'horneado', label: 'Horneado' },
		{ value: 'corte', label: 'Corte' },
		{ value: 'decoracion', label: 'Decoración' },
	],
	equipo: [
		{ value: 'general', label: 'General' },
		{ value: 'electrodomestico', label: 'Electrodoméstico' },
		{ value: 'profesional', label: 'Profesional' },
	],
};
