
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey: string | null;
  foreignKeys: ForeignKeyInfo[];
  rowCount: number;
  sampleData: any[];
  enums: string[];
  indexes: string[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimary: boolean;
  isForeignKey: boolean;
  references?: { table: string; column: string };
}

interface ForeignKeyInfo {
  column: string;
  foreignTable: string;
  foreignColumn: string;
}

async function analyzeFullSchema() {
  console.log('🔍 Analyzing complete database schema...\n');

  const report: any = {
    generatedAt: new Date().toISOString(),
    database: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0],
    tables: {},
    relationships: [],
    enums: {},
    summary: {}
  };

  // Get all tables
  const tables = [
    'recipes', 'ingredients', 'production_batches', 'inventory_transactions',
    'orders', 'order_items', 'clients', 'profiles', 'user_roles', 'roles',
    'suppliers', 'shopping_list', 'batch_quality_control', 'purchase_orders',
    'expense_categories', 'expenses'
  ];

  for (const table of tables) {
    console.log(`📊 Analyzing ${table}...`);
    
    // Get column info
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: table });
    
    // Alternative: query information_schema directly
    const { data: colInfo, error: infoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', table)
      .eq('table_schema', 'public');

    // Get primary keys
    const { data: pkInfo, error: pkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_name', table)
      .eq('constraint_type', 'PRIMARY KEY');

    // Get foreign keys
    const { data: fkInfo, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_name', table)
      .eq('constraint_type', 'FOREIGN KEY');

    // Get row count
    const { count, error: countError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    // Get sample data (first 3 rows)
    const { data: sample, error: sampleError } = await supabase
      .from(table)
      .select('*')
      .limit(3);

    // Get indexes
    const { data: indexes, error: idxError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_name', table)
      .eq('constraint_type', 'UNIQUE');

    // Build table info
    report.tables[table] = {
      columns: colInfo || [],
      rowCount: count || 0,
      sampleData: sample || [],
      primaryKeys: pkInfo || [],
      foreignKeys: fkInfo || [],
      indexes: indexes || []
    };
  }

  // Get all enums
  const { data: enums, error: enumError } = await supabase
    .rpc('get_enums');

  if (enums) {
    report.enums = enums;
  }

  // Build relationship map
  for (const table of tables) {
    const fks = report.tables[table]?.foreignKeys || [];
    for (const fk of fks) {
      report.relationships.push({
        from: table,
        constraint: fk.constraint_name
      });
    }
  }

  // Generate summary
  report.summary = {
    totalTables: tables.length,
    tablesWithData: Object.values(report.tables).filter((t: any) => t.rowCount > 0).length,
    totalRows: Object.values(report.tables).reduce((sum: number, t: any) => sum + (t.rowCount || 0), 0),
    enumsCount: Object.keys(report.enums).length
  };

  // Save report
  const outputDir = path.join(__dirname, '../analysis');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDir, `full-schema-${timestamp}.json`);
  const mdPath = path.join(outputDir, `full-schema-${timestamp}.md`);

  // Save JSON
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ JSON report saved: ${jsonPath}`);

  // Generate markdown
  const md = generateMarkdown(report);
  fs.writeFileSync(mdPath, md);
  console.log(`✅ Markdown report saved: ${mdPath}`);

  console.log('\n📋 Summary:');
  console.log(`   Total Tables: ${report.summary.totalTables}`);
  console.log(`   Tables with data: ${report.summary.tablesWithData}`);
  console.log(`   Total Rows: ${report.summary.totalRows}`);
  console.log(`   Enums: ${report.summary.enumsCount}`);
}

function generateMarkdown(report: any): string {
  let md = `# Database Schema Analysis\n\n`;
  md += `Generated: ${report.generatedAt}\n`;
  md += `Database: ${report.database}\n\n`;

  md += `## Summary\n\n`;
  md += `- **Total Tables**: ${report.summary.totalTables}\n`;
  md += `- **Tables with Data**: ${report.summary.tablesWithData}\n`;
  md += `- **Total Rows**: ${report.summary.totalRows}\n`;
  md += `- **Enums**: ${report.summary.enumsCount}\n\n`;

  md += `## Tables\n\n`;

  for (const [tableName, table] of Object.entries(report.tables)) {
    md += `### ${tableName}\n\n`;
    md += `- **Rows**: ${(table as any).rowCount}\n`;
    
    md += `\n#### Columns\n\n`;
    md += `| Column | Type | Nullable | Default |\n`;
    md += `|--------|------|----------|---------|\n`;
    
    for (const col of (table as any).columns || []) {
      md += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || '-'} |\n`;
    }

    if ((table as any).sampleData?.length > 0) {
      md += `\n#### Sample Data\n\n`;
      md += '```json\n';
      md += JSON.stringify((table as any).sampleData, null, 2);
      md += '\n```\n\n';
    }

    md += `---\n\n`;
  }

  md += `## Relationships\n\n`;
  for (const rel of report.relationships) {
    md += `- ${rel.from}: ${rel.constraint}\n`;
  }

  return md;
}

// Run the analysis
analyzeFullSchema().catch(console.error);
