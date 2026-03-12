import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTables() {
  console.log('🔍 Checking which tables exist...\n');
  
  const tables = [
    'recipes',
    'ingredients',
    'production_batches',
    'inventory_transactions',
    'orders',
    'order_items',
    'clients',
    'profiles',
    'user_roles',
    'roles'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: NOT FOUND`);
      } else {
        console.log(`✅ ${table}: EXISTS`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ERROR - ${e.message}`);
    }
  }
}

checkTables();
