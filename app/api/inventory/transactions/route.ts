import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const ingredientId = searchParams.get("ingredientId");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  let query = supabaseAdmin
    .from("inventory_transactions")
    .select("id, ingredient_id, quantity, type, reference_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (ingredientId) query = query.eq("ingredient_id", ingredientId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data ?? [] });
}
