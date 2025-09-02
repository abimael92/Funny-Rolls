// lib/data.ts
import { Product } from './types';

export const products: Product[] = [
	{
		id: 1,
		name: 'Roll Clásico Risueño',
		price: 50,
		image: '/img/classic-cinnamon-roll-with-icing.png',
		description:
			'Nuestro rollo de canela emblemático que te hará reír de alegría',
		rating: 5,
	},
	{
		id: 2,
		name: 'Roll de Choco Risas',
		price: 65,
		image: '/img/chocolate-cinnamon-roll-with-chocolate-drizzle.png',
		description: 'Doble chocolate delicioso que es seriamente divertido',
		rating: 5,
	},
	{
		id: 3,
		name: 'Remolino de Fresa',
		price: 60,
		image: '/img/strawberry-cinnamon-roll-with-pink-icing.png',
		description: 'Giro dulce de fresa que te hará sonreír',
		rating: 4.8,
	},
	{
		id: 4,
		name: 'Arándano en Verano',
		price: 65,
		image: '/img/blueberry-cinnamon-roll-with-cream-cheese-icing.png',
		description: 'Repleto de arándanos y risas',
		rating: 4.9,
	},
	{
		id: 5,
		name: 'Glaseado Divertido',
		price: 45,
		image: '/img/glazed-cinnamon-roll-with-sugar-glaze.png',
		description: 'Simple, dulce y garantizado para hacerte reír',
		rating: 4.7,
	},
	{
		id: 6,
		name: 'Caramelo Crujiente',
		price: 70,
		image: '/img/caramel-cinnamon-roll-with-crunchy-topping.png',
		description: 'Delicioso caramelo crujiente que te hará reír a carcajadas',
		rating: 5,
	},
];
