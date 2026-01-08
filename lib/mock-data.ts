// lib/mock-data.ts
import { Product, ProductionRecord, Recipe } from './types';

export function generateMockProductionData(
	recipes: Recipe[],
	products: Product[]
): ProductionRecord[] {
	// Filter only available recipes
	const availableRecipes = recipes.filter((r) => {
		const product = products.find((p) => p.recipe.id === r.id);
		return product?.available; // ← ONLY check product.available
	});
	const recipeNames = availableRecipes.map((r) => r.name);

	if (recipeNames.length === 0) {
		console.log('No available recipes for mock data generation');
		return [];
	}

	const data: ProductionRecord[] = [];
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth(); // 0-11

	// Generate data for current month and 2 previous months
	for (let monthOffset = 1; monthOffset <= 3; monthOffset++) {
		const targetMonth = currentMonth - monthOffset;
		const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
		const actualMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;

		// Determine days in the month (approximate)
		const daysInMonth = new Date(targetYear, actualMonth + 1, 0).getDate();

		// Generate data for 8-12 random days in the month (more realistic)
		const daysToGenerate = Math.floor(Math.random() * 5) + 8;

		// Select random days
		const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
			.sort(() => Math.random() - 0.5)
			.slice(0, daysToGenerate);

		for (const day of days) {
			const date = new Date(targetYear, actualMonth, day);

			// Only generate for weekdays (Monday-Friday) for realism
			const dayOfWeek = date.getDay();
			if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

			// Generate 1-2 production records per day (not 3)
			const recordCount = Math.floor(Math.random() * 2) + 1;

			for (let i = 0; i < recordCount; i++) {
				const recipe =
					availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
				const recipeName = recipe.name;

				// Realistic batch count: 1-2 batches per production (not 3)
				const batchCount = Math.floor(Math.random() * 2) + 1;
				const totalProduced = batchCount * (recipe?.batchSize || 10);

				// Simplified realistic production outcomes
				let goodCount, soldCount, badCount;
				const quality = Math.random();

				if (quality > 0.8) {
					// Good production (20% of time)
					goodCount = Math.floor(totalProduced * 0.9);
					soldCount = totalProduced - goodCount;
					badCount = 0;
				} else if (quality > 0.4) {
					// Average production (40% of time)
					goodCount = Math.floor(totalProduced * 0.7);
					soldCount = Math.floor((totalProduced - goodCount) * 0.6);
					badCount = totalProduced - goodCount - soldCount;
				} else {
					// Poor production (40% of time)
					goodCount = Math.floor(totalProduced * 0.5);
					badCount = Math.floor((totalProduced - goodCount) * 0.4);
					soldCount = totalProduced - goodCount - badCount;
				}

				// Ensure no negative counts
				goodCount = Math.max(0, goodCount);
				soldCount = Math.max(0, soldCount);
				badCount = Math.max(0, badCount);

				// Adjust if total doesn't match
				const total = goodCount + soldCount + badCount;
				if (total !== totalProduced) {
					goodCount += totalProduced - total;
				}

				data.push({
					id: `prod-${targetYear}-${actualMonth + 1}-${day}-${i}-${Date.now()}`,
					recipeId: recipe?.id || '1',
					recipeName,
					batchCount,
					date: date.toISOString(),
					totalProduced,
					items: [
						...(goodCount > 0
							? [
									{
										id: `item-${targetYear}-${actualMonth + 1}-${day}-${i}-1`,
										status: 'good' as const,
										quantity: goodCount,
									},
							  ]
							: []),
						...(soldCount > 0
							? [
									{
										id: `item-${targetYear}-${actualMonth + 1}-${day}-${i}-2`,
										status: 'sold' as const,
										quantity: soldCount,
									},
							  ]
							: []),
						...(badCount > 0
							? [
									{
										id: `item-${targetYear}-${actualMonth + 1}-${day}-${i}-3`,
										status: 'bad' as const,
										quantity: badCount,
									},
							  ]
							: []),
					],
				});
			}
		}
	}

	console.log(
		'Generated',
		data.length,
		'mock production records for',
		availableRecipes.length,
		'available recipes'
	);
	console.log(
		'Sample dates:',
		data.slice(0, 3).map((d) => new Date(d.date).toLocaleDateString())
	);

	return data;
}
