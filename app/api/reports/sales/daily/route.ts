import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const start = `${date}T00:00:00.000Z`;
  const end = `${date}T23:59:59.999Z`;
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, total, status, created_at")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const totalSales = (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
  const paid = (orders ?? []).filter((o) => o.status === "paid" || o.status === "completed");
  return NextResponse.json({
    date,
    orderCount: orders?.length ?? 0,
    paidCount: paid.length,
    totalSales,
    averageTicket: paid.length > 0 ? totalSales / paid.length : 0,
    orders: orders ?? [],
  });
}
