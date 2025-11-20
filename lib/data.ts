// lib/data.ts
import { Product, Ingredient, Tool } from './types';

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
	{
		id: '6',
		name: 'Huevos',
		price: 45,
		unit: 'docena',
		amount: 1,
		minAmount: 0.3,
	},
	{
		id: '7',
		name: 'Leche',
		price: 25,
		unit: 'litro',
		amount: 1,
		minAmount: 0.3,
	},
	{
		id: '8',
		name: 'Crema para glaseado',
		price: 85,
		unit: 'kg',
		amount: 1,
		minAmount: 0.1,
	},
	{
		id: '9',
		name: 'Chocolate',
		price: 150,
		unit: 'kg',
		amount: 1,
		minAmount: 0.1,
	},
	{
		id: '10',
		name: 'Fresas',
		price: 80,
		unit: 'kg',
		amount: 1,
		minAmount: 0.2,
	},
	{
		id: '11',
		name: 'Arándanos',
		price: 120,
		unit: 'kg',
		amount: 1,
		minAmount: 0.2,
	},
	{
		id: '12',
		name: 'Caramelo',
		price: 95,
		unit: 'kg',
		amount: 1,
		minAmount: 0.1,
	},
	{
		id: '13',
		name: 'Queso crema',
		price: 110,
		unit: 'kg',
		amount: 1,
		minAmount: 0.1,
	},
	{
		id: '14',
		name: 'Esencia de vainilla',
		price: 180,
		unit: 'litro',
		amount: 1,
		minAmount: 0.01,
	},
	{ id: '15', name: 'Sal', price: 8, unit: 'kg', amount: 1, minAmount: 0.005 },
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
	// UTILITIES (operational costs - direct pass-through)
	{
		id: 'util-1',
		name: 'Horno',
		type: 'consumible',
		category: 'energy',
		cost: 2.5, // $2.50 MXN por lote
		description: 'Consumo eléctrico por horneado (180°C por 25-30 min)',
		lifetime: 'Operational',
		recoveryValue: 0,
	},
	{
		id: 'util-2',
		name: 'Estufa',
		type: 'consumible',
		category: 'energy',
		cost: 0.8, // $0.80 MXN por lote
		description: 'Consumo de gas para preparaciones en estufa',
		lifetime: 'Operational',
		recoveryValue: 0,
	},
	{
		id: 'util-3',
		name: 'Mezcladora',
		type: 'consumible',
		category: 'equipment',
		cost: 1.2, // $1.20 MXN por lote
		description: 'Consumo eléctrico por batch de masa',
		lifetime: 'Operational',
		recoveryValue: 0,
	},

	// herramientaS (amortized costs - portion per batch)
	{
		id: 'uten-1',
		name: 'Juego de Medidores',
		type: 'herramienta',
		category: 'measuring',
		cost: 0.5, // $0.50 MXN por lote
		description: 'Tazas y cucharas medidoras para ingredientes',
		lifetime: '2 años',
		recoveryValue: 15, // $15 MXN valor de reventa
	},
	{
		id: 'uten-2',
		name: 'Báscula Digital',
		type: 'herramienta',
		category: 'measuring',
		cost: 0.8, // $0.80 MXN por lote
		description: 'Para mediciones precisas en gramos',
		lifetime: '3 años',
		recoveryValue: 25, // $25 MXN valor de reventa
	},
	{
		id: 'uten-3',
		name: 'Bowls Mezcladores',
		type: 'herramienta',
		category: 'mixing',
		cost: 0.4, // $0.40 MXN por lote
		description: 'Set de bowls de diferentes tamaños',
		lifetime: '2 años',
		recoveryValue: 10, // $10 MXN valor de reventa
	},
	{
		id: 'uten-4',
		name: 'Batidor de Alambre',
		type: 'herramienta',
		category: 'mixing',
		cost: 0.25, // $0.25 MXN por lote
		description: 'Para incorporar aire en mezclas',
		lifetime: '1.5 años',
		recoveryValue: 5, // $5 MXN valor de reventa
	},
	{
		id: 'uten-5',
		name: 'Espátula de Goma',
		type: 'herramienta',
		category: 'mixing',
		cost: 0.2, // $0.20 MXN por lote
		description: 'Para raspar bowls y mezclar suavemente',
		lifetime: '1 año',
		recoveryValue: 2, // $2 MXN valor de reventa
	},
	{
		id: 'uten-6',
		name: 'Rodillo para Masa',
		type: 'herramienta',
		category: 'shaping',
		cost: 0.6, // $0.60 MXN por lote
		description: 'Para extender masa uniformemente',
		lifetime: '2 años',
		recoveryValue: 20, // $20 MXN valor de reventa
	},
	{
		id: 'uten-7',
		name: 'Moldes para Hornear',
		type: 'herramienta',
		category: 'baking',
		cost: 1.0, // $1.00 MXN por lote
		description: 'Charolas para hornear rolls',
		lifetime: '3 años',
		recoveryValue: 30, // $30 MXN valor de reventa
	},
	{
		id: 'uten-8',
		name: 'Cuchillo de Sierra',
		type: 'herramienta',
		category: 'cutting',
		cost: 0.3, // $0.30 MXN por lote
		description: 'Para cortar rolls sin aplastar',
		lifetime: '2 años',
		recoveryValue: 8, // $8 MXN valor de reventa
	},
	{
		id: 'uten-9',
		name: 'Termómetro Digital',
		type: 'herramienta',
		category: 'measuring',
		cost: 0.45, // $0.45 MXN por lote
		description: 'Para temperatura interna perfecta',
		lifetime: '3 años',
		recoveryValue: 12, // $12 MXN valor de reventa
	},

	// especializadoS (premium equipment - higher amortization)
	{
		id: 'enh-1',
		name: 'Mezcladora Planetaria',
		type: 'especializado',
		category: 'equipment',
		cost: 3.5, // $3.50 MXN por lote
		description: 'Mezclado profesional para consistencia perfecta',
		lifetime: '5 años',
		recoveryValue: 200, // $200 MXN valor de reventa
	},
	{
		id: 'enh-2',
		name: 'Proveedora de Masa',
		type: 'especializado',
		category: 'equipment',
		cost: 2.0, // $2.00 MXN por lote
		description: 'Control de temperatura para fermentación óptima',
		lifetime: '4 años',
		recoveryValue: 80, // $80 MXN valor de reventa
	},
	{
		id: 'enh-3',
		name: 'Soplete Culinario',
		type: 'especializado',
		category: 'finishing',
		cost: 1.5, // $1.50 MXN por lote
		description: 'Para acabados caramelizados y decoraciones',
		lifetime: '3 años',
		recoveryValue: 40, // $40 MXN valor de reventa
	},
	{
		id: 'enh-4',
		name: 'Manga Pastelera',
		type: 'especializado',
		category: 'decorating',
		cost: 0.35, // $0.35 MXN por lote
		description: 'Para decoraciones precisas con glaseados',
		lifetime: '1 año',
		recoveryValue: 3, // $3 MXN valor de reventa
	},
	{
		id: 'enh-5',
		name: 'Kit de Medición Avanzado',
		type: 'especializado',
		category: 'measuring',
		cost: 1.2, // $1.20 MXN por lote
		description: 'Medidores de precisión para profesionales',
		lifetime: '4 años',
		recoveryValue: 60, // $60 MXN valor de reventa
	},
];

export const toolCategories = {
	consumible: [
		{ value: 'general', label: 'General' },
		{ value: 'empaque', label: 'Empaque' },
		{ value: 'limpieza', label: 'Limpieza' },
		// Add more categories as needed
	],
	herramienta: [
		{ value: 'general', label: 'General' },
		{ value: 'cocina', label: 'Cocina' },
		{ value: 'medicion', label: 'Medición' },
		// Add more categories as needed
	],
	equipo: [
		{ value: 'general', label: 'General' },
		{ value: 'electrodomestico', label: 'Electrodoméstico' },
		{ value: 'utensilio', label: 'Utensilio' },
		// Add more categories as needed
	],
	especializado: [
		// Add this
		{ value: 'general', label: 'General' },
		{ value: 'profesional', label: 'Profesional' },
		{ value: 'tecnicocientifico', label: 'Técnico-Científico' },
	],
};
