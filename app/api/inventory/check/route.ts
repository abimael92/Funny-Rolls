import { NextRequest, NextResponse } from "next/server";
import { checkStock } from "@/lib/inventory-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ingredientId = searchParams.get("ingredientId");
  const quantity = Number(searchParams.get("quantity")) || 0;
  if (!ingredientId || quantity < 0) {
    return NextResponse.json({ error: "ingredientId and positive quantity required" }, { status: 400 });
  }
  const ok = await checkStock(ingredientId, quantity);
  return NextResponse.json({ sufficient: ok });
}
