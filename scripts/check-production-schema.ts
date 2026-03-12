
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProductionSchema() {
  console.log('🔍 Checking production_batches schema...\n');
  
  // Try to get one record (if exists)
  const { data, error } = await supabase
    .from('production_batches')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Error accessing table:', error.message);
    console.log('\nTable might not exist or have different name');
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Table exists with columns:');
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));
  } else {
    console.log('✅ Table exists but is empty');
    console.log('\nTo see schema, we need to inspect the table definition:');
  }
  
  // Alternative: Try to insert a test record to see required columns
  console.log('\n📝 To see required columns, try creating a test record');
}

checkProductionSchema();
