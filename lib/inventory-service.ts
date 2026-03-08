/**
 * Server-side inventory service. Use from API routes only (uses supabaseAdmin).
 */
import { supabaseAdmin } from "./supabase-server";

export type InventoryTransactionType = "order" | "production" | "restock" | "adjustment";

export async function getStock(ingredientId: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { data } = await supabaseAdmin
    .from("ingredients")
    .select("current_stock")
    .eq("id", ingredientId)
    .single();
  return Number(data?.current_stock ?? 0);
}

export async function checkStock(ingredientId: string, quantity: number): Promise<boolean> {
  const stock = await getStock(ingredientId);
  return stock >= quantity;
}

export async function updateStock(
  ingredientId: string,
  delta: number,
  type: InventoryTransactionType,
  referenceId?: string | null,
  notes?: string
): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: row } = await supabaseAdmin
    .from("ingredients")
    .select("current_stock")
    .eq("id", ingredientId)
    .single();
  if (!row) return false;
  const current = Number(row.current_stock ?? 0);
  const next = Math.max(0, current + delta);
  const { error: updateErr } = await supabaseAdmin
    .from("ingredients")
    .update({ current_stock: next })
    .eq("id", ingredientId);
  if (updateErr) return false;
  await supabaseAdmin.from("inventory_transactions").insert({
    ingredient_id: ingredientId,
    quantity: delta,
    type,
    reference_id: referenceId ?? null,
    notes: notes ?? null,
  });
  return true;
}

export interface LowStockItem {
  id: string;
  name: string;
  current_stock: number;
  reorder_level: number;
  unit: string;
}

export async function getLowStockItems(): Promise<LowStockItem[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("ingredients")
    .select("id, name, current_stock, reorder_level, unit")
    .not("reorder_level", "is", null);
  if (!data) return [];
  const items = data as { id: string; name: string; current_stock: number; reorder_level: number; unit: string }[];
  return items.filter((i) => Number(i.current_stock ?? 0) <= Number(i.reorder_level ?? 0));
}

export async function getInventoryValue(): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { data } = await supabaseAdmin
    .from("ingredients")
    .select("current_stock, price_per_unit");
  if (!data) return 0;
  return (data as { current_stock: number; price_per_unit: number }[]).reduce(
    (sum, i) => sum + Number(i.current_stock ?? 0) * Number(i.price_per_unit ?? 0),
    0
  );
}
