import * as fs from "fs";
import * as path from "path";

type ProblemSeverity = "info" | "warning" | "error";

interface ConsistencyProblem {
  severity: ProblemSeverity;
  table: string;
  message: string;
}

interface DataConsistencyReport {
  generatedAt: string;
  problems: ConsistencyProblem[];
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
}

interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

interface DatabaseAnalysis {
  generatedAt: string;
  tables: TableInfo[];
}

type MigrationStep = {
  phase: number;
  id: string;
  title: string;
  description: string;
  sql?: string;
};

type MigrationPlan = {
  generatedAt: string;
  phases: {
    phase: number;
    title: string;
    goals: string[];
    steps: MigrationStep[];
  }[];
};

function readJsonIfExists<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function suggestMissingTable(
  db: DatabaseAnalysis,
  name: string
): boolean {
  return !db.tables.some((t) => t.table_name === name);
}

function buildPlan(
  db: DatabaseAnalysis | null,
  consistency: DataConsistencyReport | null
): MigrationPlan {
  const phases: MigrationPlan["phases"] = [];

  // Phase 1 – Stabilize production & IDs
  const p1Steps: MigrationStep[] = [];
  const hasProductionBatches =
    db?.tables.some((t) => t.table_name === "production_batches") ?? false;

  if (hasProductionBatches) {
    p1Steps.push({
      phase: 1,
      id: "p1-sync-production-batches-schema",
      title: "Align production_batches schema with API expectations",
      description:
        "Ensure production_batches has consistent types (uuid ids, text recipe_id, numeric quantity_produced) and that no legacy columns (e.g. batch_count) remain referenced by API routes.",
    });
  }

  const idProblems =
    consistency?.problems.filter(
      (p) =>
        p.message.includes("mixed id formats") ||
        p.message.includes("recipe_id uses mixed formats")
    ) ?? [];

  if (idProblems.length) {
    p1Steps.push({
      phase: 1,
      id: "p1-normalize-ids",
      title: "Normalize primary and foreign keys (UUID vs numeric)",
      description:
        "Introduce a consistent UUID-based primary key strategy for recipes, ingredients, production batches and orders. Add surrogate UUID keys where needed and backfill foreign keys.",
    });
  }

  phases.push({
    phase: 1,
    title: "Stabilize production data model & identifiers",
    goals: [
      "Stop all 500s from schema mismatches (e.g. missing columns)",
      "Ensure every core table has a stable primary key strategy",
      "Preserve existing production data during migrations",
    ],
    steps: p1Steps,
  });

  // Phase 2 – Orders, customers, inventory
  const p2Steps: MigrationStep[] = [];
  if (db && suggestMissingTable(db, "orders")) {
    p2Steps.push({
      phase: 2,
      id: "p2-create-orders-table",
      title: "Create orders table with POS + online support",
      description:
        "Create an orders table capturing order_number, customer, totals, status, payment info, and metadata for CFDI/SAT compliance.",
      sql: [
        "CREATE TABLE IF NOT EXISTS orders (",
        "  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
        "  order_number text UNIQUE NOT NULL,",
        "  status text NOT NULL DEFAULT 'pending',",
        "  payment_status text NOT NULL DEFAULT 'unpaid',",
        "  payment_method text,",
        "  subtotal numeric(10,2),",
        "  tax numeric(10,2),",
        "  total numeric(10,2),",
        "  customer_name text,",
        "  customer_phone text,",
        "  customer_email text,",
        "  cfdi_use text,",
        "  tax_id text,",
        "  created_at timestamptz DEFAULT now(),",
        "  completed_at timestamptz",
        ");",
      ].join("\n"),
    });
  }

  if (db && suggestMissingTable(db, "order_items")) {
    p2Steps.push({
      phase: 2,
      id: "p2-create-order-items-table",
      title: "Create order_items table linked to orders",
      description:
        "Create order_items with product, quantity, unit price, subtotal and optional recipe snapshot for historical pricing.",
    });
  }

  phases.push({
    phase: 2,
    title: "Introduce orders, customers and inventory enforcement",
    goals: [
      "Persist all sales as structured orders",
      "Link orders to production batches for traceability",
      "Tie inventory movements to orders and production",
    ],
    steps: p2Steps,
  });

  // Phase 3 – Costing & planning
  const p3Steps: MigrationStep[] = [
    {
      phase: 3,
      id: "p3-ingredient-pricing",
      title: "Harden ingredient pricing model",
      description:
        "Ensure ingredients table includes price_per_unit, current_stock, reorder_level and category; migrate any legacy price fields and update all cost calculations to use these columns.",
    },
    {
      phase: 3,
      id: "p3-production-planning",
      title: "Add planning metadata to production_batches",
      description:
        "Introduce planned_at / planned_for dates, per-batch status (planned, in_progress, completed) and link batches to orders, enabling shopping lists and capacity planning.",
    },
  ];

  phases.push({
    phase: 3,
    title: "Cost calculation, production planning and shopping lists",
    goals: [
      "Use real supplier prices for all cost calculations",
      "Drive ingredient shopping lists from planned production and current stock",
      "Align production statuses with UI flows (planned → in_progress → completed)",
    ],
    steps: p3Steps,
  });

  // Phase 4 – Reporting & compliance
  const p4Steps: MigrationStep[] = [
    {
      phase: 4,
      id: "p4-financial-views",
      title: "Create reporting views for sales and production",
      description:
        "Add database views (and optional materialized views) that aggregate daily/monthly sales, product mix, and production yields to power dashboards and export endpoints.",
    },
    {
      phase: 4,
      id: "p4-cfdi-sat-integration",
      title: "Prepare CFDI/SAT integration",
      description:
        "Extend orders with SAT-required fields (uso CFDI, RFC, regimen fiscal) and design an integration layer to generate CFDI documents via a PAC, ensuring Chihuahua/México commercial compliance.",
    },
  ];

  phases.push({
    phase: 4,
    title: "Reporting, CFDI and SAT-compliant operations",
    goals: [
      "Provide reliable financial and operational reporting",
      "Support SAT/CFDI invoicing for qualifying sales",
      "Enable CSV/Excel exports for accountants and management",
    ],
    steps: p4Steps,
  });

  return {
    generatedAt: new Date().toISOString(),
    phases,
  };
}

function writePlan(plan: MigrationPlan): void {
  const outDir = path.join(process.cwd(), "analysis");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonPath = path.join(outDir, "migration-plan.json");
  fs.writeFileSync(jsonPath, JSON.stringify(plan, null, 2), "utf8");

  const mdLines: string[] = [];
  mdLines.push(`# Migration Plan`);
  mdLines.push("");
  mdLines.push(`Generated at: ${plan.generatedAt}`);
  mdLines.push("");

  for (const phase of plan.phases) {
    mdLines.push(`## Phase ${phase.phase} – ${phase.title}`);
    mdLines.push("");
    mdLines.push("**Goals:**");
    mdLines.push("");
    for (const g of phase.goals) {
      mdLines.push(`- ${g}`);
    }
    mdLines.push("");
    mdLines.push("**Steps:**");
    mdLines.push("");
    for (const step of phase.steps) {
      mdLines.push(`- **${step.id}** – ${step.title}`);
      mdLines.push(`  - ${step.description}`);
      if (step.sql) {
        mdLines.push("  - Suggested SQL (partial):");
        mdLines.push("");
        mdLines.push("    ```sql");
        mdLines.push(
          step.sql
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")
        );
        mdLines.push("    ```");
      }
    }
    mdLines.push("");
  }

  const mdPath = path.join(outDir, "migration-plan.md");
  fs.writeFileSync(mdPath, mdLines.join("\n"), "utf8");
}

async function main(): Promise<void> {
  try {
    const analysisPath = path.join(
      process.cwd(),
      "analysis",
      "database-analysis.json"
    );
    const consistencyPath = path.join(
      process.cwd(),
      "analysis",
      "data-consistency-report.json"
    );

    const db = readJsonIfExists<DatabaseAnalysis>(analysisPath);
    const consistency = readJsonIfExists<DataConsistencyReport>(consistencyPath);

    const plan = buildPlan(db, consistency);
    writePlan(plan);

    // eslint-disable-next-line no-console
    console.log(
      "Migration plan generated at ./analysis/migration-plan.{json,md}"
    );
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to generate migration plan", err);
    process.exit(1);
  }
}

void main();

