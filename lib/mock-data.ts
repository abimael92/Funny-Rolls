// lib/mock-data.ts
import { ProductionRecord, Recipe } from './types';

export function generateMockProductionData(
	recipes: Recipe[]
): ProductionRecord[] {
	const recipeNames = recipes.map((r) => r.name);
	if (recipeNames.length === 0)
		recipeNames.push(
			'Roll Clásico Risueño',
			'Roll de Choco Risas',
			'Remolino de Fresa'
		);

	const data: ProductionRecord[] = [];
	const currentYear = new Date().getFullYear();

	// Generate 3 months of data for September, October, November
	const months = [
		{ month: 8, name: 'September', pattern: 'weekday' }, // September: Monday-Thursday
		{ month: 9, name: 'October', pattern: 'weekend' }, // October: Friday-Sunday
		{ month: 10, name: 'November', pattern: 'mixed' }, // November: Mixed pattern
	];

	months.forEach(({ month, pattern }) => {
		// Get correct days in month
		let daysInMonth: number;
		if (month === 10) {
			daysInMonth = 30; // November has 30 days
		} else if (month === 8) {
			daysInMonth = 30; // September has 30 days
		} else {
			daysInMonth = 31; // October has 31 days
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(currentYear, month, day);
			const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

			let shouldGenerate = false;

			if (pattern === 'weekday' && dayOfWeek >= 1 && dayOfWeek <= 4) {
				shouldGenerate = true; // Monday-Thursday
			} else if (
				pattern === 'weekend' &&
				(dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0)
			) {
				shouldGenerate = true; // Friday-Sunday
			} else if (pattern === 'mixed') {
				shouldGenerate = true; // All days for November
			}

			if (shouldGenerate) {
				const recordCount = Math.floor(Math.random() * 4) + 1;

				for (let i = 0; i < recordCount; i++) {
					const recipeName =
						recipeNames[Math.floor(Math.random() * recipeNames.length)];
					const recipe = recipes.find((r) => r.name === recipeName);
					const batchCount = Math.floor(Math.random() * 3) + 1;
					const totalProduced = batchCount * (recipe?.batchSize || 12);

					let goodCount, soldCount, badCount;

					if (month === 8) {
						// September
						// September: 60-90% good
						goodCount = Math.floor(totalProduced * (Math.random() * 0.3 + 0.6));
						soldCount = Math.floor((totalProduced - goodCount) * 0.5);
						badCount = totalProduced - goodCount - soldCount;
					} else if (month === 9) {
						// October
						// October: 80% sold
						soldCount = Math.floor(totalProduced * 0.8);
						goodCount = totalProduced - soldCount;
						badCount = 0;
					} else {
						// November
						// November: Mixed patterns
						if (day <= 7) {
							// First week: Perfect production
							goodCount = totalProduced;
							soldCount = 0;
							badCount = 0;
						} else if (day <= 14) {
							// Second week: Bad production
							goodCount = Math.floor(totalProduced * 0.3);
							badCount = totalProduced - goodCount;
							soldCount = 0;
						} else if (day <= 21) {
							// Third week: Balance of 2 (equal good and sold)
							goodCount = Math.floor(totalProduced / 2);
							soldCount = totalProduced - goodCount;
							badCount = 0;
						} else {
							// Last week: Mixed
							goodCount = Math.floor(
								totalProduced * (Math.random() * 0.4 + 0.4)
							);
							soldCount = Math.floor((totalProduced - goodCount) * 0.6);
							badCount = totalProduced - goodCount - soldCount;
						}
					}

					data.push({
						id: `${
							month === 8 ? 'sep' : month === 9 ? 'oct' : 'nov'
						}-${day}-${i}`,
						recipeId: recipe?.id || '1',
						recipeName,
						batchCount,
						date: date.toISOString(),
						totalProduced,
						items: [
							...(goodCount > 0
								? [
										{
											id: `item-${day}-${i}-1`,
											status: 'good' as const,
											quantity: goodCount,
										},
								  ]
								: []),
							...(soldCount > 0
								? [
										{
											id: `item-${day}-${i}-2`,
											status: 'sold' as const,
											quantity: soldCount,
										},
								  ]
								: []),
							...(badCount > 0
								? [
										{
											id: `item-${day}-${i}-3`,
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
	});

	return data;
}
