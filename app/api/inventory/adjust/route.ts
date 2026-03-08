import { NextRequest, NextResponse } from "next/server";
import { updateStock } from "@/lib/inventory-service";
import type { InventoryTransactionType } from "@/lib/inventory-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredientId, delta, type, referenceId, notes } = body as {
      ingredientId: string;
      delta: number;
      type?: InventoryTransactionType;
      referenceId?: string;
      notes?: string;
    };
    if (!ingredientId || delta == null || typeof delta !== "number") {
      return NextResponse.json({ error: "ingredientId and delta required" }, { status: 400 });
    }
    const t = (type && ["order", "production", "restock", "adjustment"].includes(type))
      ? type
      : "adjustment";
    const ok = await updateStock(ingredientId, delta, t, referenceId ?? null, notes);
    if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
