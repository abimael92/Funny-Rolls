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
	console.log(`Started: ${new Date().toISOString()}`);
	console.log(`Supabase URL: ${supabaseUrl}`);

	const auditDir = path.join(process.cwd(), 'db-audit');
	if (!fs.existsSync(auditDir)) {
		fs.mkdirSync(auditDir);
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const outputFile = path.join(auditDir, `full-audit-${timestamp}.json`);
	const summaryFile = path.join(auditDir, `summary-${timestamp}.txt`);

	const audit = {
		timestamp: new Date().toISOString(),
		tables: {},
		relationships: [],
		issues: [],
		recommendations: [],
		missingTables: [],
		rlsIssues: [],
		schemaIssues: []
	};

	// Complete list of tables that should exist
	const expectedTables = [
		{ name: 'recipes', priority: 'P0', purpose: 'Recipe definitions' },
		{ name: 'ingredients', priority: 'P0', purpose: 'Ingredient inventory' },
		{ name: 'orders', priority: 'P0', purpose: 'Customer orders' },
		{ name: 'order_items', priority: 'P0', purpose: 'Order line items' },
		{ name: 'payments', priority: 'P0', purpose: 'Payment processing' },
		{ name: 'inventory_transactions', priority: 'P1', purpose: 'Stock movement tracking' },
		{ name: 'production_batches', priority: 'P1', purpose: 'Production records' },
		{ name: 'profiles', priority: 'P1', purpose: 'User profiles' },
		{ name: 'materials', priority: 'P2', purpose: 'Materials (alternative to ingredients)' },
		{ name: 'products', priority: 'P2', purpose: 'Products for sale' },
		{ name: 'tools', priority: 'P2', purpose: 'Kitchen tools' },
		{ name: 'categories', priority: 'P2', purpose: 'Product categories' },
		{ name: 'users', priority: 'P2', purpose: 'Users table' },
		{ name: 'production_records', priority: 'P2', purpose: 'Legacy production tracking' }
	];

	console.log('\n📋 CHECKING TABLES:');

	for (const tableInfo of expectedTables) {
		const tableName = tableInfo.name;
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

				// Get columns
				const columns = sample && sample[0] ? Object.keys(sample[0]) : [];

				// Try to check RLS
				let rlsStatus = 'unknown';
				try {
					const { error: rlsError } = await supabase
						.from(tableName)
						.insert({ test: 'test' })
						.select();

					if (rlsError?.message?.includes('permission denied') ||
						rlsError?.message?.includes('violates row-level security')) {
						rlsStatus = 'enabled';
					} else if (rlsError?.message?.includes('duplicate key')) {
						rlsStatus = 'enabled (with public write)';
					} else if (!rlsError) {
						rlsStatus = 'disabled - public write allowed!';
						audit.rlsIssues.push({ table: tableName, issue: 'RLS disabled - public can write' });
					}
				} catch (e) {
					rlsStatus = 'unknown';
				}

				audit.tables[tableName] = {
					exists: true,
					rowCount: count || 0,
					columns: columns,
					columnDetails: await getColumnDetails(tableName),
					rls: rlsStatus,
					sample: sample && sample[0] ? sample[0] : null,
					priority: tableInfo.priority,
					purpose: tableInfo.purpose
				};

				console.log(`✅ EXISTS (${count || 0} rows, RLS: ${rlsStatus})`);

				// Run table-specific checks
				if (tableName === 'ingredients') {
					await checkIngredients(audit);
				}
				if (tableName === 'recipes') {
					await checkRecipes(audit);
				}
				if (tableName === 'orders') {
					await checkOrders(audit);
				}
				if (tableName === 'payments') {
					await checkPayments(audit);
				}
				if (tableName === 'order_items') {
					await checkOrderItems(audit);
				}
			} else if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
				console.log('❌ does not exist');
				audit.tables[tableName] = { exists: false, priority: tableInfo.priority, purpose: tableInfo.purpose };
				audit.missingTables.push({ name: tableName, priority: tableInfo.priority, purpose: tableInfo.purpose });
			} else {
				console.log(`⚠️  error: ${error.message}`);
				audit.tables[tableName] = { exists: false, error: error.message, priority: tableInfo.priority };
			}
		} catch (e) {
			console.log(`⚠️  exception: ${e.message}`);
			audit.tables[tableName] = { exists: false, error: e.message, priority: tableInfo.priority };
		}
	}

	// Helper to get column details
	async function getColumnDetails(tableName) {
		try {
			const { data } = await supabase
				.from('information_schema.columns')
				.select('column_name, data_type, is_nullable')
				.eq('table_name', tableName)
				.eq('table_schema', 'public');
			return data || [];
		} catch (e) {
			return [];
		}
	}

	// Check ingredients table in detail
	async function checkIngredients(audit) {
		console.log('\n🔍 DETAILED INGREDIENTS CHECK:');

		if (!audit.tables.ingredients?.exists) return;

		// Get all ingredients
		const { data: ingredients } = await supabase
			.from('ingredients')
			.select('id, name, price, price_per_unit, current_stock, unit, reorder_level, category')
			.limit(100);

		if (ingredients) {
			console.log(`  Total ingredients: ${ingredients.length}`);

			// Check for required columns
			const requiredCols = ['price_per_unit', 'current_stock', 'unit', 'reorder_level'];
			const columns = audit.tables.ingredients.columns || [];

			requiredCols.forEach(col => {
				if (!columns.includes(col)) {
					audit.schemaIssues.push({
						table: 'ingredients',
						issue: `Missing column: ${col}`,
						fix: `ALTER TABLE ingredients ADD COLUMN ${col} DECIMAL(10,2) DEFAULT 0;`
					});
				}
			});

			// Check for zero stock items
			const zeroStock = ingredients.filter(i => i.current_stock === 0 || i.current_stock === null);
			if (zeroStock.length > 0) {
				console.log(`  ⚠️  ${zeroStock.length} ingredients have zero stock`);
			}

			// Check for missing prices
			const noPrice = ingredients.filter(i => !i.price_per_unit && !i.price);
			if (noPrice.length > 0) {
				console.log(`  ⚠️  ${noPrice.length} ingredients missing price`);
			}

			// Sample output
			console.log('\n  Sample ingredients:');
			ingredients.slice(0, 3).forEach(i => {
				console.log(`    - ${i.name}: $${i.price_per_unit || i.price} | Stock: ${i.current_stock || 0} ${i.unit || ''}`);
			});
		}
	}

	// Check recipes table
	async function checkRecipes(audit) {
		console.log('\n🔍 DETAILED RECIPES CHECK:');

		if (!audit.tables.recipes?.exists) return;

		const { data: recipes } = await supabase
			.from('recipes')
			.select('id, name, ingredients, tools, yield, selling_price')
			.limit(10);

		if (recipes && recipes.length > 0) {
			console.log(`  Found ${recipes.length} recipes`);

			// Check recipe structure
			const sampleRecipe = recipes[0];
			console.log('\n  Sample recipe:');
			console.log(`    ID: ${sampleRecipe.id}`);
			console.log(`    Name: ${sampleRecipe.name}`);
			console.log(`    Yield: ${sampleRecipe.yield}`);
			console.log(`    Price: $${sampleRecipe.selling_price}`);

			// Check ingredients format
			if (sampleRecipe.ingredients) {
				console.log(`    Ingredients: ${JSON.stringify(sampleRecipe.ingredients).substring(0, 100)}...`);

				// Check if ingredients use UUIDs or numeric IDs
				const firstIngredient = Array.isArray(sampleRecipe.ingredients) ? sampleRecipe.ingredients[0] : null;
				if (firstIngredient) {
					const idType = firstIngredient.ingredientId?.includes('-') ? 'UUID' : 'numeric';
					console.log(`    Ingredient ID type: ${idType}`);

					if (idType === 'numeric') {
						audit.issues.push({
							table: 'recipes',
							issue: 'Recipe uses numeric ingredient IDs instead of UUIDs',
							impact: 'Cannot link to ingredients table properly',
							fix: 'Update recipes to use actual ingredient UUIDs'
						});
					}
				}
			}
		}
	}

	// Check orders table
	async function checkOrders(audit) {
		console.log('\n🔍 DETAILED ORDERS CHECK:');

		if (!audit.tables.orders?.exists) return;

		const { data: orders } = await supabase
			.from('orders')
			.select('id, order_number, status, total, created_at')
			.limit(5);

		if (orders) {
			console.log(`  Found ${audit.tables.orders.rowCount} total orders`);
			if (orders.length > 0) {
				console.log('  Recent orders:');
				orders.forEach(o => {
					console.log(`    - ${o.order_number}: ${o.status} | $${o.total}`);
				});
			}
		}

		// Check for order_number format
		const { data: sample } = await supabase
			.from('orders')
			.select('order_number')
			.limit(1);

		if (sample && sample[0]?.order_number) {
			const orderNum = sample[0].order_number;
			console.log(`  Order number format: ${orderNum}`);
			if (!orderNum.startsWith('FR-')) {
				audit.issues.push({
					table: 'orders',
					issue: 'Order numbers not using FR-YYYY-XXXXX format',
					impact: 'Inconsistent order numbering',
					fix: 'Use generate_order_number() function'
				});
			}
		}
	}

	// Check payments table
	async function checkPayments(audit) {
		console.log('\n🔍 DETAILED PAYMENTS CHECK:');

		if (!audit.tables.payments?.exists) return;

		const { data: payments } = await supabase
			.from('payments')
			.select('id, method, amount, status, created_at')
			.limit(5);

		if (payments) {
			console.log(`  Found ${audit.tables.payments.rowCount} total payments`);
			if (payments.length > 0) {
				console.log('  Recent payments:');
				payments.forEach(p => {
					console.log(`    - ${p.method}: $${p.amount} | ${p.status}`);
				});
			}
		}
	}

	// Check order_items table
	async function checkOrderItems(audit) {
		console.log('\n🔍 DETAILED ORDER ITEMS CHECK:');

		if (!audit.tables.order_items?.exists) return;

		const columns = audit.tables.order_items.columns || [];

		// Check for recipe_id column
		if (!columns.includes('recipe_id')) {
			audit.schemaIssues.push({
				table: 'order_items',
				issue: 'Missing recipe_id column',
				impact: 'Cannot decrement inventory from orders',
				fix: 'ALTER TABLE order_items ADD COLUMN recipe_id uuid;'
			});
		}
	}

	// Check foreign key relationships
	console.log('\n🔗 CHECKING RELATIONSHIPS:');

	const relationships = [
		{ from: 'order_items', col: 'order_id', to: 'orders', status: 'unknown' },
		{ from: 'payments', col: 'order_id', to: 'orders', status: 'unknown' },
		{ from: 'inventory_transactions', col: 'ingredient_id', to: 'ingredients', status: 'unknown' }
	];

	for (const rel of relationships) {
		if (audit.tables[rel.from]?.exists && audit.tables[rel.to]?.exists) {
			// Try to test the relationship
			const { data } = await supabase
				.from(rel.from)
				.select(`${rel.col}, ${rel.to}(id)`)
				.limit(1);

			if (data && data[0] && data[0][rel.to]) {
				rel.status = '✅ working';
			} else {
				rel.status = '⚠️  missing or broken';
				audit.relationships.push(rel);
			}
		} else {
			rel.status = '❌ tables missing';
		}
		console.log(`  ${rel.from}.${rel.col} → ${rel.to}: ${rel.status}`);
	}

	// Generate recommendations
	console.log('\n💡 GENERATING RECOMMENDATIONS:');

	// Priority-based missing tables
	const p0Missing = audit.missingTables.filter(t => t.priority === 'P0');
	if (p0Missing.length > 0) {
		audit.recommendations.push(`🔴 P0 CRITICAL: Create missing tables: ${p0Missing.map(t => t.name).join(', ')}`);
	}

	const p1Missing = audit.missingTables.filter(t => t.priority === 'P1');
	if (p1Missing.length > 0) {
		audit.recommendations.push(`🟠 P1 HIGH: Create tables: ${p1Missing.map(t => t.name).join(', ')}`);
	}

	// RLS issues
	if (audit.rlsIssues.length > 0) {
		audit.recommendations.push(`🔴 P0 CRITICAL: Fix RLS on: ${audit.rlsIssues.map(i => i.table).join(', ')}`);
	}

	// Schema issues
	audit.schemaIssues.forEach(issue => {
		audit.recommendations.push(`🟡 P2: ${issue.table} - ${issue.issue}`);
	});

	// Ingredient checks
	if (audit.tables.ingredients?.exists) {
		const { data: ingredients } = await supabase
			.from('ingredients')
			.select('current_stock, price_per_unit');

		if (ingredients) {
			const zeroStock = ingredients.filter(i => !i.current_stock).length;
			if (zeroStock === ingredients.length) {
				audit.recommendations.push('🟠 P1: No ingredients have stock - need to set initial inventory');
			}

			const noPrice = ingredients.filter(i => !i.price_per_unit).length;
			if (noPrice > 0) {
				audit.recommendations.push(`🟠 P1: ${noPrice} ingredients missing price_per_unit`);
			}
		}
	}

	// Write audit file
	fs.writeFileSync(outputFile, JSON.stringify(audit, null, 2));

	// Generate summary file
	let summary = `FUNNY ROLLS DATABASE AUDIT SUMMARY
${'='.repeat(50)}
Generated: ${audit.timestamp}

EXISTING TABLES:
${'-'.repeat(30)}\n`;

	let foundCount = 0;
	for (const [name, info] of Object.entries(audit.tables)) {
		if (info.exists) {
			summary += `✅ ${name} (${info.rowCount} rows, RLS: ${info.rls || 'unknown'})\n`;
			foundCount++;
		}
	}

	summary += `\nMISSING TABLES (${audit.missingTables.length}):\n`;
	audit.missingTables.forEach(t => {
		summary += `❌ [${t.priority}] ${t.name} - ${t.purpose}\n`;
	});

	if (audit.issues.length > 0) {
		summary += `\nISSUES (${audit.issues.length}):\n`;
		audit.issues.forEach(issue => {
			summary += `⚠️  ${issue.table}: ${issue.issue}\n`;
		});
	}

	summary += `\nRECOMMENDATIONS (${audit.recommendations.length}):\n`;
	audit.recommendations.forEach((rec, i) => {
		summary += `${i + 1}. ${rec}\n`;
	});

	fs.writeFileSync(summaryFile, summary);

	// Print summary
	console.log('\n' + '='.repeat(50));
	console.log('📋 AUDIT SUMMARY');
	console.log('='.repeat(50));
	console.log(`\n✅ Audit complete!`);
	console.log(`📁 Full report: ${outputFile}`);
	console.log(`📊 Summary: ${summaryFile}`);

	console.log('\n📊 TABLES FOUND:');
	for (const [name, info] of Object.entries(audit.tables)) {
		if (info.exists) {
			console.log(`  ✅ ${name} (${info.rowCount} rows)`);
			foundCount++;
		}
	}

	console.log(`\n📊 TABLES MISSING: ${audit.missingTables.length}`);
	audit.missingTables.slice(0, 5).forEach(t => {
		console.log(`  ❌ [${t.priority}] ${t.name}`);
	});

	if (audit.recommendations.length > 0) {
		console.log('\n🎯 TOP RECOMMENDATIONS:');
		audit.recommendations.slice(0, 5).forEach((rec, i) => {
			console.log(`  ${i + 1}. ${rec}`);
		});
	}
}

fullAudit().catch(console.error);