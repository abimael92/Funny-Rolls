// scripts/setup-production-db.js
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

async function setupDatabase() {
    console.log('\n🔧 FUNNY ROLLS PRODUCTION DATABASE SETUP');
    console.log('='.repeat(50));

    const setupLog = {
        timestamp: new Date().toISOString(),
        steps: [],
        errors: [],
        warnings: []
    };

    // Step 1: Add missing columns to ingredients table
    console.log('\n📦 STEP 1: Enhancing ingredients table...');

    try {
        // Check current ingredients
        const { data: ingredients, error: fetchError } = await supabase
            .from('ingredients')
            .select('*');

        if (fetchError) {
            throw fetchError;
        }

        console.log(`  Found ${ingredients.length} ingredients`);

        // Note: We need to use raw SQL for column additions
        // Since Supabase JavaScript client can't ALTER TABLE, we'll output SQL commands
        console.log('\n  ⚠️  Cannot add columns via JavaScript API.');
        console.log('  Please run these SQL commands in Supabase SQL editor:');
        console.log('\n  -- Add missing columns to ingredients:');
        console.log('  ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2);');
        console.log('  ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS current_stock DECIMAL(10,2) DEFAULT 0;');
        console.log('  ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS reorder_level DECIMAL(10,2) DEFAULT 0;');
        console.log('  ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category TEXT;');

        setupLog.steps.push('Generated SQL for ingredients table enhancement');

    } catch (error) {
        console.error('  ❌ Error:', error.message);
        setupLog.errors.push(`Ingredients enhancement failed: ${error.message}`);
    }

    // Step 2: Create POS tables (SQL commands)
    console.log('\n📦 STEP 2: Creating POS tables...');
    console.log('\n  Run these SQL commands in Supabase SQL editor:');
    console.log('\n  -- Create orders table');
    console.log(`  CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    payment_method TEXT,
    subtotal_cents INTEGER,
    tax_cents INTEGER,
    total_cents INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    metadata JSONB
  );`);

    console.log('\n  -- Create order_items table');
    console.log(`  CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    recipe_snapshot JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  );`);

    console.log('\n  -- Create inventory_transactions table');
    console.log(`  CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_change DECIMAL(10,2) NOT NULL,
    transaction_type TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    previous_stock DECIMAL(10,2),
    new_stock DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );`);

    console.log('\n  -- Create production_batches table');
    console.log(`  CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id TEXT NOT NULL,
    quantity_produced INTEGER NOT NULL,
    ingredients_used JSONB,
    tools_used JSONB,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
  );`);

    console.log('\n  -- Create profiles table (for users)');
    console.log(`  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'staff',
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`);

    setupLog.steps.push('Generated SQL for POS tables creation');

    // Step 3: Fix ingredient ID mismatch
    console.log('\n📦 STEP 3: Fixing ingredient ID mismatch...');

    try {
        // Get all ingredients with their UUIDs
        const { data: ingredients, error: ingError } = await supabase
            .from('ingredients')
            .select('id, name');

        if (ingError) throw ingError;

        // Create a mapping of ingredient names to IDs
        const ingredientMap = {};
        ingredients.forEach(ing => {
            if (ing.name.toLowerCase() === 'harina') ingredientMap['1'] = ing.id;
            if (ing.name.toLowerCase() === 'azúcar') ingredientMap['2'] = ing.id;
            if (ing.name.toLowerCase() === 'mantequilla') ingredientMap['3'] = ing.id;
            if (ing.name.toLowerCase() === 'huevos') ingredientMap['4'] = ing.id;
            if (ing.name.toLowerCase() === 'leche') ingredientMap['5'] = ing.id;
            if (ing.name.toLowerCase() === 'canela') ingredientMap['6'] = ing.id;
            if (ing.name.toLowerCase() === 'glaseado') ingredientMap['7'] = ing.id;
        });

        console.log('\n  Ingredient mapping:');
        Object.entries(ingredientMap).forEach(([oldId, uuid]) => {
            console.log(`    ID ${oldId} → ${uuid}`);
        });

        // Get the Oreo recipe
        const { data: recipes, error: recipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('name', 'Oreo');

        if (recipeError) throw recipeError;

        if (recipes && recipes.length > 0) {
            const recipe = recipes[0];
            const updatedIngredients = recipe.ingredients.map(ing => {
                const uuid = ingredientMap[ing.ingredientId];
                if (uuid) {
                    return {
                        ...ing,
                        ingredientId: uuid
                    };
                }
                return ing;
            });

            console.log('\n  Would update recipe ingredients:');
            console.log(`    Original: ${JSON.stringify(recipe.ingredients)}`);
            console.log(`    New: ${JSON.stringify(updatedIngredients)}`);

            // Output SQL to update
            console.log('\n  Run this SQL to update the recipe:');
            console.log(`  UPDATE recipes SET ingredients = '${JSON.stringify(updatedIngredients).replace(/'/g, "''")}' WHERE id = '${recipe.id}';`);
        }

        setupLog.steps.push('Generated ingredient ID mapping and update SQL');

    } catch (error) {
        console.error('  ❌ Error:', error.message);
        setupLog.errors.push(`Ingredient mapping failed: ${error.message}`);
    }

    // Step 4: Create initial inventory from ingredients
    console.log('\n📦 STEP 4: Setting up initial inventory...');

    try {
        const { data: ingredients, error: ingError } = await supabase
            .from('ingredients')
            .select('id, name, price, unit');

        if (ingError) throw ingError;

        console.log('\n  Would set initial stock for:');
        ingredients.forEach(ing => {
            console.log(`    ${ing.name}: 0 ${ing.unit} (needs manual entry)`);
        });

        console.log('\n  Run these SQL commands to set initial stock:');
        ingredients.forEach(ing => {
            console.log(`  UPDATE ingredients SET current_stock = 0, price_per_unit = ${ing.price || 0} WHERE id = '${ing.id}';`);
        });

        setupLog.steps.push('Generated initial inventory SQL');

    } catch (error) {
        console.error('  ❌ Error:', error.message);
        setupLog.errors.push(`Inventory setup failed: ${error.message}`);
    }

    // Step 5: Create RLS policies
    console.log('\n📦 STEP 5: Setting up RLS policies...');

    console.log('\n  Run these SQL commands to enable RLS:');
    console.log(`
  -- Enable RLS on all tables
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  -- Create policies for authenticated users
  CREATE POLICY "Allow all for authenticated" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

  CREATE POLICY "Allow all for authenticated" ON order_items
    FOR ALL USING (auth.role() = 'authenticated');

  CREATE POLICY "Allow all for authenticated" ON inventory_transactions
    FOR ALL USING (auth.role() = 'authenticated');

  CREATE POLICY "Allow all for authenticated" ON production_batches
    FOR ALL USING (auth.role() = 'authenticated');

  CREATE POLICY "Allow all for authenticated" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');
  `);

    setupLog.steps.push('Generated RLS policies');

    // Write setup log
    const logFile = path.join(process.cwd(), 'db-audit', `setup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(logFile, JSON.stringify(setupLog, null, 2));

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ SETUP INSTRUCTIONS GENERATED');
    console.log('='.repeat(50));
    console.log('\n📋 Next Steps:');
    console.log('1. Go to Supabase SQL editor');
    console.log('2. Run the SQL commands from STEP 1 to add columns');
    console.log('3. Run SQL from STEP 2 to create tables');
    console.log('4. Run SQL from STEP 3 to fix recipe ingredient IDs');
    console.log('5. Run SQL from STEP 4 to set initial stock');
    console.log('6. Run SQL from STEP 5 to enable RLS');
    console.log('\n📁 Full setup log saved to:', logFile);

    if (setupLog.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        setupLog.errors.forEach(err => console.log('  ', err));
    }
}

setupDatabase().catch(console.error);