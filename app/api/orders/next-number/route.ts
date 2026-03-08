import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 503 }
    );
  }
  try {
    const { data, error } = await supabaseAdmin.rpc("generate_order_number");
    if (error) {
      console.error("generate_order_number error:", error);
      return NextResponse.json(
        { error: error.message, fallback: `FR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}` },
        { status: 200 }
      );
    }
    return NextResponse.json({ orderNumber: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate order number" },
      { status: 500 }
    );
  }
}
