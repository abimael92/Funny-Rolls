import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

type Body = {
  orderId: string;
  method: "cash" | "card" | "mock";
  amount: number;
  status?: "initiated" | "authorized" | "paid" | "failed";
  amountReceived?: number;
  changeDue?: number;
  idempotencyKey?: string;
};

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  try {
    const body = (await request.json()) as Body;
    const { orderId, method, amount, amountReceived, changeDue, idempotencyKey } = body;
    const status = body.status ?? "paid";
    if (!orderId || !method || amount == null) {
      return NextResponse.json({ error: "orderId, method, amount required" }, { status: 400 });
    }
    if (!["cash", "card", "mock"].includes(method)) {
      return NextResponse.json({ error: "method must be cash, card, or mock" }, { status: 400 });
    }

    const insert: Record<string, unknown> = {
      order_id: orderId,
      method,
      amount: Number(amount),
      status,
      amount_received: amountReceived != null ? Number(amountReceived) : null,
      change_due: changeDue != null ? Number(changeDue) : null,
      idempotency_key: idempotencyKey || null,
    };

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert(insert)
      .select("id, order_id, method, amount, status, created_at")
      .single();

    if (error) {
      if (error.code === "23505" && idempotencyKey) {
        const { data: existing } = await supabaseAdmin
          .from("payments")
          .select("id, order_id, status")
          .eq("idempotency_key", idempotencyKey)
          .single();
        return NextResponse.json(existing ?? { error: error.message }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
