import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

type TableBackupSummary = {
  table: string;
  rows: number;
  file: string;
};

type MigrationReport = {
  generatedAt: string;
  backupDir: string;
  backups: TableBackupSummary[];
  notes: string[];
};

const TABLES_TO_BACKUP = [
  "recipes",
  "ingredients",
  "production_batches",
  "inventory_transactions",
  "orders",
  "order_items",
  "clients",
  "profiles",
] as const;

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

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function backupTable(
  client: SupabaseClient,
  table: string,
  backupDir: string
): Promise<TableBackupSummary> {
  const { data, error } = await client.from(table).select("*");
  if (error) {
    // eslint-disable-next-line no-console
    console.warn(`Skipping backup for table ${table}: ${error.message}`);
    return { table, rows: 0, file: "" };
  }

  const rows = data ?? [];
  const file = path.join(backupDir, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), "utf8");

  return { table, rows: rows.length, file };
}

async function backupCurrentData(client: SupabaseClient): Promise<{
  backupDir: string;
  summaries: TableBackupSummary[];
}> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", `pre-migration-${timestamp}`);
  ensureDir(backupDir);

  const summaries: TableBackupSummary[] = [];

  for (const table of TABLES_TO_BACKUP) {
    // eslint-disable-next-line no-console
    console.log(`Backing up table ${table}...`);
    const summary = await backupTable(client, table, backupDir);
    summaries.push(summary);
  }

  return { backupDir, summaries };
}

async function main(): Promise<void> {
  const client = createSupabaseAdmin();
  const notes: string[] = [];

  try {
    // 1. Back up current data
    const { backupDir, summaries } = await backupCurrentData(client);
    notes.push(`Backups created under ${backupDir}`);

    // 2. Run migrations
    notes.push(
      "Run Supabase migrations (e.g. `supabase db push` or your CI pipeline) to apply new schema."
    );

    // 3. Migrate mock data to real tables (placeholder)
    notes.push(
      "Review `analysis/mock-usage-report.*` and replace remaining mock data sources with real Supabase queries before going live."
    );

    // 4. Validate data integrity (placeholder)
    notes.push(
      "After migrations, run `ts-node scripts/validate-data-consistency.ts` to verify IDs and cross-table references."
    );

    // 5. Create initial test data (optional)
    notes.push(
      "Optionally seed minimal test data for dev/staging (clients, suppliers, one or two recipes) using a separate seed script."
    );

    const report: MigrationReport = {
      generatedAt: new Date().toISOString(),
      backupDir,
      backups: summaries,
      notes,
    };

    const outDir = path.join(process.cwd(), "analysis");
    ensureDir(outDir);
    const reportPath = path.join(outDir, "migrate-to-production-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

    // eslint-disable-next-line no-console
    console.log(
      `Migration pre-flight complete. Backups at ${backupDir}, report at ${reportPath}.`
    );
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Migration pre-flight failed", err);
    process.exit(1);
  }
}

void main();

