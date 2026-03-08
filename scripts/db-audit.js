// scripts/db-full-audit.js
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fullAudit() {
	console.log('\n🔍 FUNNY ROLLS FULL DATABASE AUDIT');
	console.log('='.repeat(50));

	const auditDir = path.join(process.cwd(), 'db-audit');
	if (!fs.existsSync(auditDir)) {
		fs.mkdirSync(auditDir);
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const outputFile = path.join(auditDir, `full-audit-${timestamp}.json`);

	const audit = {
		timestamp: new Date().toISOString(),
		tables: {},
		relationships: [],
		issues: [],
		recommendations: []
	};

	// Tables we know about or suspect exist
	const tablesToCheck = [
		'recipes',
		'ingredients',
		'materials',
		'profiles',
		'products',
		'inventory',
		'orders',
		'order_items',
		'production_batches',
		'production_records',
		'tools',
		'categories',
		'users'
	];

	console.log('\n📋 CHECKING TABLES:');

	for (const tableName of tablesToCheck) {
		process.stdout.write(`  ${tableName}... `);

		try {
			// Check if table exists by trying to select
			const { data, error } = await supabase
				.from(tableName)
				.select('*')
				.limit(1);

			if (!error) {
				// Get row count
				const { count } = await supabase
					.from(tableName)
					.select('*', { count: 'exact', head: true });

				// Get a sample row to see structure
				const { data: sample } = await supabase
					.from(tableName)
					.select('*')
					.limit(1);

				// Get columns by looking at sample data
				const columns = sample && sample[0] ? Object.keys(sample[0]) : [];

				audit.tables[tableName] = {
					exists: true,
					rowCount: count || 0,
					columns: columns,
					sample: sample && sample[0] ? sample[0] : null
				};

				console.log(`✅ EXISTS (${count || 0} rows)`);

				// Check for specific issues
				if (tableName === 'ingredients') {
					await checkIngredients(audit, tableName);
				}
				if (tableName === 'recipes') {
					await checkRecipes(audit, tableName);
				}
			} else if (error.code === 'PGRST116' || error.message?.includes('relation')) {
				console.log('❌ does not exist');
				audit.tables[tableName] = { exists: false };
			} else {
				console.log(`⚠️  error: ${error.message}`);
				audit.tables[tableName] = { exists: false, error: error.message };
			}
		} catch (e) {
			console.log(`⚠️  exception: ${e.message}`);
			audit.tables[tableName] = { exists: false, error: e.message };
		}
	}

	// Check ingredients table in detail
	async function checkIngredients(audit, tableName) {
		console.log('\n🔍 DETAILED INGREDIENTS CHECK:');

		// Check for IDs 9-13
		const { data: ingredients } = await supabase
			.from('ingredients')
			.select('id, name')
			.in('id', [9, 10, 11, 12, 13]);

		if (ingredients) {
			const missingIds = [9, 10, 11, 12, 13].filter(id =>
				!ingredients.some(i => i.id === id)
			);

			if (missingIds.length > 0) {
				audit.issues.push({
					table: 'ingredients',
					issue: 'Missing ingredient IDs',
					details: `IDs ${missingIds.join(', ')} not found`,
					impact: 'Recipes referencing these IDs will have incorrect calculations'
				});
				console.log(`  ⚠️  Missing IDs: ${missingIds.join(', ')}`);
			} else {
				console.log('  ✅ All IDs 9-13 present');
			}
		}

		// Check for price_per_unit column
		if (audit.tables.ingredients?.columns) {
			if (!audit.tables.ingredients.columns.includes('price_per_unit')) {
				audit.issues.push({
					table: 'ingredients',
					issue: 'Missing price_per_unit column',
					impact: 'Cannot calculate ingredient costs'
				});
				console.log('  ⚠️  Missing price_per_unit column');
			}

			if (!audit.tables.ingredients.columns.includes('unit')) {
				audit.issues.push({
					table: 'ingredients',
					issue: 'Missing unit column',
					impact: 'Cannot convert measurements'
				});
				console.log('  ⚠️  Missing unit column');
			}

			if (!audit.tables.ingredients.columns.includes('current_stock')) {
				audit.issues.push({
					table: 'ingredients',
					issue: 'Missing current_stock column',
					impact: 'Cannot track inventory levels'
				});
				console.log('  ⚠️  Missing current_stock column');
			}
		}
	}

	// Check recipes table
	async function checkRecipes(audit, tableName) {
		console.log('\n🔍 DETAILED RECIPES CHECK:');

		const { data: recipes } = await supabase
			.from('recipes')
			.select('id, name, ingredients, tools, yield')
			.limit(10);

		if (recipes && recipes.length > 0) {
			console.log(`  Found ${recipes.length} recipes`);

			// Check recipe structure
			const sampleRecipe = recipes[0];
			console.log('\n  Sample recipe structure:');
			console.log(`    ${JSON.stringify(sampleRecipe, null, 2)}`);

			// Check if recipes reference missing ingredients
			if (audit.tables.ingredients) {
				const { data: allIngredients } = await supabase
					.from('ingredients')
					.select('id');

				const existingIngredientIds = new Set(allIngredients?.map(i => i.id) || []);
				let recipesWithMissingRefs = 0;

				for (const recipe of recipes) {
					if (recipe.ingredients) {
						const ingredientIds = Object.keys(recipe.ingredients).map(Number);
						const missing = ingredientIds.filter(id => !existingIngredientIds.has(id));
						if (missing.length > 0) {
							recipesWithMissingRefs++;
						}
					}
				}

				if (recipesWithMissingRefs > 0) {
					audit.issues.push({
						table: 'recipes',
						issue: 'Recipes reference missing ingredients',
						details: `${recipesWithMissingRefs} recipes reference non-existent ingredients`,
						impact: 'Cost calculations will be incorrect'
					});
				}
			}

			// Check for required fields
			const requiredFields = ['name', 'ingredients', 'yield'];
			const missingFields = requiredFields.filter(f => !sampleRecipe.hasOwnProperty(f));

			if (missingFields.length > 0) {
				audit.issues.push({
					table: 'recipes',
					issue: 'Missing required fields',
					details: `Missing: ${missingFields.join(', ')}`,
					impact: 'Recipe calculations may fail'
				});
			}
		}
	}

	// Generate recommendations
	console.log('\n💡 GENERATING RECOMMENDATIONS:');

	// Check if we have the core tables we need
	const coreTables = {
		ingredients: { present: audit.tables.ingredients?.exists || false, purpose: 'ingredient management' },
		recipes: { present: audit.tables.recipes?.exists || false, purpose: 'recipe definitions' }
	};

	if (!coreTables.ingredients.present) {
		audit.recommendations.push('🔴 P0: Create ingredients table - core for cost calculations');
	}
	if (!coreTables.recipes.present) {
		audit.recommendations.push('🔴 P0: Create recipes table - core for production');
	}

	// Check for missing POS tables
	const posTables = ['orders', 'order_items', 'inventory_transactions', 'production_batches'];
	const missingPOSTables = posTables.filter(t => !audit.tables[t]?.exists);

	if (missingPOSTables.length > 0) {
		audit.recommendations.push(`🟠 P1: Create POS tables: ${missingPOSTables.join(', ')}`);
	}

	// Add ingredient structure recommendations
	if (audit.tables.ingredients?.exists) {
		if (!audit.tables.ingredients.columns.includes('price_per_unit')) {
			audit.recommendations.push('🔴 P0: Add price_per_unit column to ingredients table');
		}
		if (!audit.tables.ingredients.columns.includes('current_stock')) {
			audit.recommendations.push('🔴 P0: Add current_stock column to ingredients table');
		}
		if (!audit.tables.ingredients.columns.includes('unit')) {
			audit.recommendations.push('🔴 P0: Add unit column to ingredients table');
		}
	}

	// Write audit file
	fs.writeFileSync(outputFile, JSON.stringify(audit, null, 2));

	// Print summary
	console.log('\n' + '='.repeat(50));
	console.log('📋 AUDIT SUMMARY');
	console.log('='.repeat(50));
	console.log(`\n✅ Audit complete!`);
	console.log(`📁 Full report: ${outputFile}`);

	console.log('\n📊 TABLES FOUND:');
	let foundCount = 0;
	for (const [name, info] of Object.entries(audit.tables)) {
		if (info.exists) {
			console.log(`  ✅ ${name} (${info.rowCount} rows)`);
			foundCount++;
		}
	}

	if (foundCount === 0) {
		console.log('  No tables found');
	}

	if (audit.issues.length > 0) {
		console.log('\n⚠️  ISSUES FOUND:');
		audit.issues.forEach((issue, i) => {
			console.log(`  ${i + 1}. ${issue.table}: ${issue.issue}`);
		});
	}

	if (audit.recommendations.length > 0) {
		console.log('\n🎯 RECOMMENDATIONS:');
		audit.recommendations.forEach((rec, i) => {
			console.log(`  ${i + 1}. ${rec}`);
		});
	}
}

fullAudit().catch(console.error);