import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

type ProblemSeverity = "info" | "warning" | "error";

type ConsistencyProblem = {
  severity: ProblemSeverity;
  table: string;
  message: string;
  details?: Record<string, unknown>;
};

type ConsistencyReport = {
  generatedAt: string;
  problems: ConsistencyProblem[];
};

interface RecipeRow {
  id: string;
  name: string;
  batch_size: number | null;
  ingredients: Array<{ ingredientId?: string; ingredient_id?: string }> | null;
}

interface IngredientRow {
  id: string;
  name: string;
}

interface ProductionBatchRow {
  id: string;
  recipe_id: string;
}

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

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function isNumeric(id: string): boolean {
  return /^[0-9]+$/.test(id);
}

async function loadCoreData(
  client: SupabaseClient
): Promise<{
  recipes: RecipeRow[];
  ingredients: IngredientRow[];
  batches: ProductionBatchRow[];
}> {
  const [recipesRes, ingredientsRes, batchesRes] = await Promise.all([
    client.from("recipes").select("id,name,batch_size,ingredients"),
    client.from("ingredients").select("id,name"),
    client.from("production_batches").select("id,recipe_id"),
  ]);

  if (recipesRes.error) {
    throw new Error(`Failed to load recipes: ${recipesRes.error.message}`);
  }
  if (ingredientsRes.error) {
    throw new Error(`Failed to load ingredients: ${ingredientsRes.error.message}`);
  }
  if (batchesRes.error) {
    throw new Error(`Failed to load production_batches: ${batchesRes.error.message}`);
  }

  return {
    recipes: (recipesRes.data ?? []) as RecipeRow[],
    ingredients: (ingredientsRes.data ?? []) as IngredientRow[],
    batches: (batchesRes.data ?? []) as ProductionBatchRow[],
  };
}

function analyzeIdConsistency(
  recipes: RecipeRow[],
  ingredients: IngredientRow[],
  batches: ProductionBatchRow[]
): ConsistencyProblem[] {
  const problems: ConsistencyProblem[] = [];

  const recipeIdKinds = new Set<string>();
  for (const r of recipes) {
    if (isUuid(r.id)) {
      recipeIdKinds.add("uuid");
    } else if (isNumeric(r.id)) {
      recipeIdKinds.add("numeric");
    } else {
      recipeIdKinds.add("other");
    }
  }
  if (recipeIdKinds.size > 1) {
    problems.push({
      severity: "warning",
      table: "recipes",
      message: `Recipes use mixed id formats: ${Array.from(recipeIdKinds).join(", ")}`,
    });
  }

  const ingredientIdKinds = new Set<string>();
  for (const i of ingredients) {
    if (isUuid(i.id)) {
      ingredientIdKinds.add("uuid");
    } else if (isNumeric(i.id)) {
      ingredientIdKinds.add("numeric");
    } else {
      ingredientIdKinds.add("other");
    }
  }
  if (ingredientIdKinds.size > 1) {
    problems.push({
      severity: "warning",
      table: "ingredients",
      message: `Ingredients use mixed id formats: ${Array.from(ingredientIdKinds).join(", ")}`,
    });
  }

  const batchRecipeIdKinds = new Set<string>();
  for (const b of batches) {
    if (isUuid(b.recipe_id)) {
      batchRecipeIdKinds.add("uuid");
    } else if (isNumeric(b.recipe_id)) {
      batchRecipeIdKinds.add("numeric");
    } else {
      batchRecipeIdKinds.add("other");
    }
  }
  if (batchRecipeIdKinds.size > 1) {
    problems.push({
      severity: "warning",
      table: "production_batches",
      message: `production_batches.recipe_id uses mixed formats: ${Array.from(
        batchRecipeIdKinds
      ).join(", ")}`,
    });
  }

  return problems;
}

function analyzeCrossReferences(
  recipes: RecipeRow[],
  ingredients: IngredientRow[],
  batches: ProductionBatchRow[]
): ConsistencyProblem[] {
  const problems: ConsistencyProblem[] = [];
  const ingredientIds = new Set(ingredients.map((i) => i.id));
  const recipeIds = new Set(recipes.map((r) => r.id));

  for (const r of recipes) {
    const ing = r.ingredients ?? [];
    for (const ri of ing) {
      const id = ri.ingredient_id ?? ri.ingredientId;
      if (!id) continue;
      if (!ingredientIds.has(id)) {
        problems.push({
          severity: "error",
          table: "recipes",
          message: `Recipe ${r.id} (${r.name}) references missing ingredient ${id}`,
        });
      }
    }
  }

  for (const b of batches) {
    if (!recipeIds.has(b.recipe_id)) {
      problems.push({
        severity: "warning",
        table: "production_batches",
        message: `Batch ${b.id} references non-existent recipe_id ${b.recipe_id}`,
      });
    }
  }

  return problems;
}

function writeReport(report: ConsistencyReport): void {
  const outDir = path.join(process.cwd(), "analysis");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonPath = path.join(outDir, "data-consistency-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const mdLines: string[] = [];
  mdLines.push(`# Data Consistency Report`);
  mdLines.push("");
  mdLines.push(`Generated at: ${report.generatedAt}`);
  mdLines.push("");

  if (!report.problems.length) {
    mdLines.push("No consistency problems detected.");
  } else {
    for (const p of report.problems) {
      mdLines.push(
        `- **[${p.severity.toUpperCase()}]** \`${p.table}\` – ${p.message.replace(
          /\|/g,
          "\\|"
        )}`
      );
    }
  }
  mdLines.push("");

  const mdPath = path.join(outDir, "data-consistency-report.md");
  fs.writeFileSync(mdPath, mdLines.join("\n"), "utf8");
}

async function main(): Promise<void> {
  try {
    const client = createSupabaseAdmin();
    const { recipes, ingredients, batches } = await loadCoreData(client);

    const problems: ConsistencyProblem[] = [];
    problems.push(...analyzeIdConsistency(recipes, ingredients, batches));
    problems.push(...analyzeCrossReferences(recipes, ingredients, batches));

    const report: ConsistencyReport = {
      generatedAt: new Date().toISOString(),
      problems,
    };

    writeReport(report);
    // eslint-disable-next-line no-console
    console.log(
      "Data consistency validation complete. Reports at ./analysis/data-consistency-report.{json,md}"
    );
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to validate data consistency", err);
    process.exit(1);
  }
}

void main();

