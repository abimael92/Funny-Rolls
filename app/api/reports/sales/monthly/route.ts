import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? new Date().getFullYear().toString();
  const month = searchParams.get("month") ?? new Date().getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}T23:59:59.999Z`;
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
    year,
    month,
    orderCount: orders?.length ?? 0,
    paidCount: paid.length,
    totalSales,
    averageTicket: paid.length > 0 ? totalSales / paid.length : 0,
  });
}
