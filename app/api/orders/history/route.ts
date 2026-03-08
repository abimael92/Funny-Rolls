import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  let query = supabaseAdmin
    .from("orders")
    .select("id, order_number, status, subtotal, tax, total, created_at, customer_name")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }
  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: (orders ?? []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      subtotal: Number(o.subtotal),
      tax: Number(o.tax),
      total: Number(o.total),
      created_at: o.created_at,
      customer_name: o.customer_name,
    })),
  });
}
