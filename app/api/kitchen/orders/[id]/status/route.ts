import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const ALLOWED = ["preparing", "ready", "completed"] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Order id required" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const status = (body as { status?: string }).status;
  if (!status || !ALLOWED.includes(status as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "status must be one of: preparing, ready, completed" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
