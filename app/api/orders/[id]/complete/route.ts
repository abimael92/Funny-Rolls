import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { updateStock } from "@/lib/inventory-service";

type RecipeIngredient = { ingredient_id?: string; ingredientId?: string; amount: number };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Order id required" }, { status: 400 });
  }
  let body: { paymentMethod: "cash" | "mock"; amountReceived?: number; changeDue?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { paymentMethod, amountReceived, changeDue } = body;
  if (!paymentMethod || !["cash", "mock"].includes(paymentMethod)) {
    return NextResponse.json({ error: "paymentMethod required (cash|mock)" }, { status: 400 });
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id, total, status")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ message: "Already paid", orderId }, { status: 200 });
  }

  const { error: statusErr } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (statusErr) {
    return NextResponse.json({ error: statusErr.message }, { status: 500 });
  }

  await supabaseAdmin.from("payments").insert({
    order_id: orderId,
    method: paymentMethod,
    amount: Number(order.total),
    status: "paid",
    amount_received: amountReceived != null ? Number(amountReceived) : null,
    change_due: changeDue != null ? Number(changeDue) : null,
    idempotency_key: `order-${orderId}-pay`,
  });

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("id, product_id, quantity, recipe_id")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    const recipeId = item.recipe_id;
    if (!recipeId) continue;
    const { data: recipe } = await supabaseAdmin
      .from("recipes")
      .select("id, ingredients, batch_size")
      .eq("id", recipeId)
      .single();
    if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) continue;
    const batchSize = Number(recipe.batch_size) || 1;
    const itemQty = Number(item.quantity) || 1;
    for (const ri of recipe.ingredients as RecipeIngredient[]) {
      const ingId = ri.ingredient_id ?? ri.ingredientId;
      if (!ingId) continue;
      const amountPerBatch = Number(ri.amount) || 0;
      const usage = (amountPerBatch / batchSize) * itemQty;
      if (usage > 0) {
        await updateStock(ingId, -usage, "order", orderId, `Order ${orderId}`);
      }
    }
  }

  return NextResponse.json({ success: true, orderId });
}
