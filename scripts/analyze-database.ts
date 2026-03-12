import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

type ColumnInfo = {
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
};

type TableInfo = {
  table_name: string;
  columns: ColumnInfo[];
  rowCount: number;
};

type ForeignKey = {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
};

type EnumType = {
  type_name: string;
  values: string[];
};

type IndexInfo = {
  table_name: string;
  index_name: string;
  index_def: string;
};

type PolicyInfo = {
  table_name: string;
  policy_name: string;
  permissive: "PERMISSIVE" | "RESTRICTIVE";
  roles: string;
  cmd: string;
  qual: string | null;
  with_check: string | null;
};

type DatabaseAnalysis = {
  generatedAt: string;
  tables: TableInfo[];
  foreignKeys: ForeignKey[];
  enums: EnumType[];
  indexes: IndexInfo[];
  policies: PolicyInfo[];
};

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment"
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchTables(client: SupabaseClient): Promise<TableInfo[]> {
  // Get all user tables in public schema
  const { data: tables, error: tablesError } = await client
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public");

  if (tablesError || !tables) {
    throw new Error(`Failed to load tables: ${tablesError?.message ?? "unknown error"}`);
  }

  const result: TableInfo[] = [];

  for (const t of tables as { table_name: string }[]) {
    const tableName = t.table_name;

    const { data: columns, error: colsError } = await client
      .from("information_schema.columns")
      .select("column_name,data_type,is_nullable,column_default")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .order("ordinal_position");

    if (colsError || !columns) {
      throw new Error(
        `Failed to load columns for table ${tableName}: ${colsError?.message ?? "unknown"}`
      );
    }

    const { data: countData, error: countError } = await client
      .from(tableName)
      .select("id", { count: "exact", head: true });

    if (countError) {
      // Some tables may not have an "id" column; fall back to approximate count
      const { count, error: fallbackError } = await client
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (fallbackError) {
        throw new Error(
          `Failed to count rows for table ${tableName}: ${fallbackError.message}`
        );
      }

      result.push({
        table_name: tableName,
        columns: columns as ColumnInfo[],
        rowCount: count ?? 0,
      });
    } else {
      const rowCount = (countData as unknown as { length?: number } | null)?.length ?? 0;
      result.push({
        table_name: tableName,
        columns: columns as ColumnInfo[],
        rowCount,
      });
    }
  }

  return result;
}

async function fetchForeignKeys(client: SupabaseClient): Promise<ForeignKey[]> {
  const { data, error } = await client.rpc("exec_sql", {
    sql: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name;
    `,
  });

  if (error) {
    throw new Error(`Failed to load foreign keys: ${error.message}`);
  }

  return (data as ForeignKey[]) ?? [];
}

async function fetchEnums(client: SupabaseClient): Promise<EnumType[]> {
  const { data, error } = await client.rpc("exec_sql", {
    sql: `
      SELECT
        t.typname AS type_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `,
  });

  if (error) {
    throw new Error(`Failed to load enums: ${error.message}`);
  }

  return (data as EnumType[]) ?? [];
}

async function fetchIndexes(client: SupabaseClient): Promise<IndexInfo[]> {
  const { data, error } = await client.rpc("exec_sql", {
    sql: `
      SELECT
        tablename AS table_name,
        indexname AS index_name,
        indexdef AS index_def
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `,
  });

  if (error) {
    throw new Error(`Failed to load indexes: ${error.message}`);
  }

  return (data as IndexInfo[]) ?? [];
}

async function fetchPolicies(client: SupabaseClient): Promise<PolicyInfo[]> {
  const { data, error } = await client.rpc("exec_sql", {
    sql: `
      SELECT
        pol.tablename                    AS table_name,
        pol.policyname                   AS policy_name,
        pol.permissive,
        pol.roles,
        pol.cmd,
        pg_get_expr(pol.qual, pol.tablerelid)       AS qual,
        pg_get_expr(pol.with_check, pol.tablerelid) AS with_check
      FROM pg_policies pol
      JOIN pg_class c ON c.oid = pol.tablerelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      ORDER BY pol.tablename, pol.policyname;
    `,
  });

  if (error) {
    throw new Error(`Failed to load RLS policies: ${error.message}`);
  }

  return (data as PolicyInfo[]) ?? [];
}

function writeReports(analysis: DatabaseAnalysis): void {
  const outDir = path.join(process.cwd(), "analysis");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonPath = path.join(outDir, "database-analysis.json");
  fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2), "utf8");

  const mdLines: string[] = [];
  mdLines.push(`# Database Analysis`);
  mdLines.push("");
  mdLines.push(`Generated at: ${analysis.generatedAt}`);
  mdLines.push("");

  mdLines.push("## Tables");
  mdLines.push("");
  for (const t of analysis.tables) {
    mdLines.push(`### ${t.table_name} (rows: ${t.rowCount})`);
    mdLines.push("");
    mdLines.push("| Column | Type | Nullable | Default |");
    mdLines.push("|--------|------|----------|---------|");
    for (const c of t.columns) {
      mdLines.push(
        `| ${c.column_name} | ${c.data_type} | ${c.is_nullable} | \`${c.column_default ?? ""}\` |`
      );
    }
    mdLines.push("");
  }

  mdLines.push("## Foreign Keys");
  mdLines.push("");
  for (const fk of analysis.foreignKeys) {
    mdLines.push(
      `- **${fk.table_name}.${fk.column_name}** → \`${fk.foreign_table_name}.${fk.foreign_column_name}\` (${fk.constraint_name})`
    );
  }
  mdLines.push("");

  mdLines.push("## Enums");
  mdLines.push("");
  for (const e of analysis.enums) {
    mdLines.push(`- **${e.type_name}**: ${e.values.join(", ")}`);
  }
  mdLines.push("");

  mdLines.push("## Indexes");
  mdLines.push("");
  for (const idx of analysis.indexes) {
    mdLines.push(`- **${idx.table_name}**.${idx.index_name}: \`${idx.index_def}\``);
  }
  mdLines.push("");

  mdLines.push("## RLS Policies");
  mdLines.push("");
  for (const p of analysis.policies) {
    mdLines.push(
      `- **${p.table_name}** / **${p.policy_name}** (${p.cmd}, ${p.permissive}, roles: ${p.roles})`
    );
    if (p.qual) mdLines.push(`  - qual: \`${p.qual}\``);
    if (p.with_check) mdLines.push(`  - check: \`${p.with_check}\``);
  }
  mdLines.push("");

  const mdPath = path.join(outDir, "database-analysis.md");
  fs.writeFileSync(mdPath, mdLines.join("\n"), "utf8");
}

async function main(): Promise<void> {
  try {
    const client = createSupabaseAdmin();

    const [tables, foreignKeys, enums, indexes, policies] = await Promise.all([
      fetchTables(client),
      fetchForeignKeys(client).catch(() => [] as ForeignKey[]),
      fetchEnums(client).catch(() => [] as EnumType[]),
      fetchIndexes(client).catch(() => [] as IndexInfo[]),
      fetchPolicies(client).catch(() => [] as PolicyInfo[]),
    ]);

    const analysis: DatabaseAnalysis = {
      generatedAt: new Date().toISOString(),
      tables,
      foreignKeys,
      enums,
      indexes,
      policies,
    };

    writeReports(analysis);

    // eslint-disable-next-line no-console
    console.log("Database analysis written to ./analysis/database-analysis.{json,md}");
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to analyze database", err);
    process.exit(1);
  }
}

void main();

