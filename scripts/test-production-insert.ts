
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testProductionInsert() {
  console.log('🔍 Testing insert to discover production_batches schema...\n');

  // First, get a valid recipe_id from the recipes table
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id')
    .limit(1);

  if (recipesError || !recipes || recipes.length === 0) {
    console.log('❌ Could not fetch a recipe ID:', recipesError?.message || 'No recipes found');
    return;
  }

  const recipeId = recipes[0].id;
  console.log(`📝 Using recipe ID: ${recipeId}`);

  // Try inserting with common field names to see what works
  const testAttempts = [
    { 
      name: 'Standard fields',
      data: {
        recipe_id: recipeId,
        quantity: 10,
        status: 'planned'
      }
    },
    {
      name: 'With batch_count',
      data: {
        recipe_id: recipeId,
        batch_count: 10,
        status: 'planned'
      }
    },
    {
      name: 'With quantity_produced',
      data: {
        recipe_id: recipeId,
        quantity_produced: 10,
        status: 'planned'
      }
    },
    {
      name: 'Minimal insert',
      data: {
        recipe_id: recipeId
      }
    }
  ];

  for (const attempt of testAttempts) {
    console.log(`\n🔄 Trying: ${attempt.name}`);
    
    const { data, error } = await supabase
      .from('production_batches')
      .insert(attempt.data)
      .select();

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        // Extract which column doesn't exist
        const match = error.message.match(/column "([^"]+)" of relation/);
        if (match) {
          console.log(`   ⚠️  Column "${match[1]}" does not exist`);
        }
      }
    } else {
      console.log(`✅ SUCCESS! Inserted:`, data);
      console.log('\n📊 Available columns from successful insert:');
      if (data && data[0]) {
        Object.keys(data[0]).forEach(col => console.log(`   - ${col}: ${typeof data[0][col]}`));
      }
      
      // Clean up - delete the test record
      if (data && data[0] && data[0].id) {
        await supabase
          .from('production_batches')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test record cleaned up');
      }
      break;
    }
  }
}

testProductionInsert();