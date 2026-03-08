import { NextResponse } from "next/server";
import { getLowStockItems } from "@/lib/inventory-service";

export async function GET() {
  const items = await getLowStockItems();
  return NextResponse.json({ items });
}
