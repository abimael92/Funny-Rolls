import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "paid,preparing";
  const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
  let query = supabaseAdmin
    .from("orders")
    .select("id, order_number, status, total, notes, created_at")
    .in("status", statuses.length ? statuses : ["paid", "preparing"])
    .order("created_at", { ascending: true });
  const { data: orders, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const withItems = await Promise.all(
    (orders ?? []).map(async (o) => {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_name, quantity")
        .eq("order_id", o.id)
        .order("created_at", { ascending: true });
      return { ...o, items: items ?? [] };
    })
  );
  return NextResponse.json({ orders: withItems });
}
