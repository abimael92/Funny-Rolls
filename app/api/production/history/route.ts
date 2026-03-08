import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  let query = supabaseAdmin
    .from("production_batches")
    .select("id, recipe_id, recipe_name, batch_count, produced_at, created_at")
    .order("produced_at", { ascending: false })
    .limit(limit);
  if (startDate) query = query.gte("produced_at", `${startDate}T00:00:00.000Z`);
  if (endDate) query = query.lte("produced_at", `${endDate}T23:59:59.999Z`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ batches: data ?? [] });
}
