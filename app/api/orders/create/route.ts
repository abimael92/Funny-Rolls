import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { DEFAULT_TAX_RATE } from "@/lib/calculations";

type OrderItemInput = {
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  recipeId?: string | null;
};

type CreateOrderBody = {
  items: OrderItemInput[];
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
};

function subtotalFromItems(items: OrderItemInput[]): number {
  return items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  try {
    const body = (await request.json()) as CreateOrderBody;
    const { items, notes, customerName, customerPhone, customerEmail } = body;
    if (!items?.length || !Array.isArray(items)) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }
    const subtotal = subtotalFromItems(items);
    const tax = subtotal * DEFAULT_TAX_RATE;
    const total = subtotal + tax;

    let orderNumber: string;
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("generate_order_number");
    if (rpcError || !rpcData) {
      orderNumber = `FR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    } else {
      orderNumber = rpcData as string;
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending",
        subtotal,
        tax,
        total,
        notes: notes?.trim() || null,
        customer_name: customerName?.trim() || null,
        customer_phone: customerPhone?.trim() || null,
        customer_email: customerEmail?.trim() || null,
      })
      .select("id, order_number, status, subtotal, tax, total, created_at")
      .single();

    if (orderError || !order) {
      console.error("orders insert error:", orderError);
      return NextResponse.json({ error: orderError?.message || "Failed to create order" }, { status: 500 });
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.productName ?? null,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      line_total: i.lineTotal,
      recipe_id: i.recipeId ?? null,
    }));

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("order_items insert error:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    return NextResponse.json({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      createdAt: order.created_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
