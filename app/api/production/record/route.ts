import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { updateStock } from "@/lib/inventory-service";

type RecipeIngredient = { ingredient_id?: string; ingredientId?: string; amount: number };

interface ProductionRecordBody {
  recipeId: string;
  recipeName?: string;
  /** Number of batches to produce (preferred, current clients use this). */
  batchCount?: number;
  /** Fallback for older clients that might send a direct quantity. */
  quantityProduced?: number;
  ingredientsUsed?: Array<{ ingredientId: string; quantity: number }>;
  notes?: string;
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Partial<ProductionRecordBody>;

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[api/production/record] incoming body", body);
    }

    const recipeId = body.recipeId?.trim();
    const recipeName = body.recipeName?.trim();
    const rawBatchCount = body.batchCount;
    const rawQuantityProduced = body.quantityProduced;
    const ingredientsUsed = body.ingredientsUsed ?? [];
    const notes = body.notes?.trim();

    if (!recipeId) {
      return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
    }

    const hasBatchCount =
      typeof rawBatchCount === "number" && Number.isFinite(rawBatchCount);
    const hasQuantityProduced =
      typeof rawQuantityProduced === "number" && Number.isFinite(rawQuantityProduced);

    if (!hasBatchCount && !hasQuantityProduced) {
      return NextResponse.json(
        { error: "Either batchCount or quantityProduced must be provided" },
        { status: 400 }
      );
    }

    const batchCount = hasBatchCount ? Math.max(1, Math.floor(rawBatchCount!)) : undefined;

    // Fetch recipe to compute quantityProduced and inventory deltas
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from("recipes")
      .select("ingredients, batch_size")
      .eq("id", recipeId)
      .single();

    if (recipeError) {
      return NextResponse.json(
        { error: `Recipe not found or inaccessible: ${recipeError.message}` },
        { status: 400 }
      );
    }

    const batchSize = Number(recipe.batch_size) || 1;

    // Derive quantityProduced from batchCount when possible, otherwise trust quantityProduced
    const quantityProduced =
      batchCount != null
        ? batchCount * batchSize
        : Math.max(0, Math.floor(rawQuantityProduced!));

    if (quantityProduced <= 0) {
      return NextResponse.json(
        { error: "quantityProduced must be greater than 0" },
        { status: 400 }
      );
    }

    // Insert into production_batches using ONLY existing columns:
    // id, recipe_id, quantity_produced, ingredients_used, tools_used, status, notes, created_at, completed_at
    const insertPayload: {
      recipe_id: string;
      quantity_produced: number;
      ingredients_used: unknown | null;
      status?: string;
      notes?: string;
    } = {
      recipe_id: recipeId,
      quantity_produced: quantityProduced,
      ingredients_used: ingredientsUsed.length ? ingredientsUsed : null,
    };

    if (notes) {
      insertPayload.notes = notes;
    }

    // Default to completed for now; production management UI can update statuses later.
    insertPayload.status = 'planned';

    const { data: batch, error: batchErr } = await supabaseAdmin
      .from("production_batches")
      .insert(insertPayload)
      .select("id, recipe_id, quantity_produced, status, notes, created_at, completed_at")
      .single();

    if (batchErr || !batch) {
      return NextResponse.json(
        { error: batchErr?.message ?? "Failed to create production batch" },
        { status: 500 }
      );
    }

    // Update inventory:
    // - If ingredientsUsed was provided, honor it as explicit deltas
    // - Otherwise, derive from recipe.ingredients and batchCount
    if (ingredientsUsed.length) {
      for (const { ingredientId, quantity } of ingredientsUsed) {
        if (ingredientId && quantity > 0) {
          await updateStock(ingredientId, quantity, "production", batch.id, `Batch ${batch.id}`);
        }
      }
    } else if (batchCount != null && Array.isArray(recipe.ingredients)) {
      const recipeIngredients = recipe.ingredients as RecipeIngredient[];
      for (const ri of recipeIngredients) {
        const ingId = ri.ingredient_id ?? ri.ingredientId;
        if (!ingId) continue;
        const amountPerBatch = Number(ri.amount) || 0;
        const totalQty = (amountPerBatch / batchSize) * batchCount;
        if (totalQty > 0) {
          await updateStock(ingId, -totalQty, "production", batch.id, `Batch ${batch.id}`);
        }
      }
    }

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[api/production/record] created batch", batch);
    }

    return NextResponse.json({ batch }, { status: 201 });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[api/production/record] unexpected error", e);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
