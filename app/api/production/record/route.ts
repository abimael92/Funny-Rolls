import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { updateStock } from "@/lib/inventory-service";

type RecipeIngredient = { ingredient_id?: string; ingredientId?: string; amount: number };

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { recipeId, recipeName, batchCount, ingredientsUsed } = body as {
      recipeId: string;
      recipeName?: string;
      batchCount: number;
      ingredientsUsed?: Array<{ ingredientId: string; quantity: number }>;
    };
    if (!recipeId || batchCount == null || batchCount < 1) {
      return NextResponse.json({ error: "recipeId and positive batchCount required" }, { status: 400 });
    }
    const { data: batch, error: batchErr } = await supabaseAdmin
      .from("production_batches")
      .insert({ recipe_id: recipeId, recipe_name: recipeName ?? null, batch_count: batchCount })
      .select("id, recipe_id, batch_count, produced_at")
      .single();
    if (batchErr || !batch) {
      return NextResponse.json({ error: batchErr?.message ?? "Failed to create batch" }, { status: 500 });
    }
    if (ingredientsUsed?.length) {
      for (const { ingredientId, quantity } of ingredientsUsed) {
        if (ingredientId && quantity > 0) {
          await updateStock(ingredientId, quantity, "production", batch.id, `Batch ${batch.id}`);
        }
      }
    } else {
      const { data: recipe } = await supabaseAdmin
        .from("recipes")
        .select("ingredients, batch_size")
        .eq("id", recipeId)
        .single();
      if (recipe?.ingredients && Array.isArray(recipe.ingredients)) {
        const batchSize = Number(recipe.batch_size) || 1;
        for (const ri of recipe.ingredients as RecipeIngredient[]) {
          const ingId = ri.ingredient_id ?? ri.ingredientId;
          if (!ingId) continue;
          const amountPerBatch = Number(ri.amount) || 0;
          const totalQty = (amountPerBatch / batchSize) * batchCount;
          if (totalQty > 0) {
            await updateStock(ingId, -totalQty, "production", batch.id, `Batch ${batch.id}`);
          }
        }
      }
    }
    return NextResponse.json({ batch });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
