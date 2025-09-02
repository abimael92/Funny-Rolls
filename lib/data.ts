// lib/data.ts
import { Product } from './types';

export const products: Product[] = [
	{
		id: 1,
		name: 'Classic Giggle Roll',
		price: 4.99,
		image: '/img/classic-cinnamon-roll-with-icing.png',
		description: "Our signature cinnamon roll that'll make you giggle with joy",
		rating: 5,
	},
	{
		id: 2,
		name: 'Chuckle Chocolate Roll',
		price: 5.99,
		image: '/img/chocolate-cinnamon-roll-with-chocolate-drizzle.png',
		description: "Double chocolate goodness that's seriously funny",
		rating: 5,
	},
	{
		id: 3,
		name: 'Snicker Strawberry Swirl',
		price: 5.49,
		image: '/img/strawberry-cinnamon-roll-with-pink-icing.png',
		description: "Sweet strawberry twist that'll make you snicker",
		rating: 4.8,
	},
	{
		id: 4,
		name: 'Belly Laugh Blueberry',
		price: 5.49,
		image: '/img/blueberry-cinnamon-roll-with-cream-cheese-icing.png',
		description: 'Bursting with blueberries and belly laughs',
		rating: 4.9,
	},
	{
		id: 5,
		name: 'Guffaw Glazed',
		price: 4.49,
		image: '/img/glazed-cinnamon-roll-with-sugar-glaze.png',
		description: 'Simple, sweet, and guaranteed to make you guffaw',
		rating: 4.7,
	},
	{
		id: 6,
		name: 'Chortle Caramel Crunch',
		price: 6.49,
		image: '/img/caramel-cinnamon-roll-with-crunchy-topping.png',
		description: "Crunchy caramel goodness that'll have you chortling",
		rating: 5,
	},
];
