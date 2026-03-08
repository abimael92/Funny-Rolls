import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateReceiptHtml } from "@/lib/receipt-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const email = (body as { email?: string }).email;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_name, quantity, unit_price, line_total")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  const receiptOrder = {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
    notes: order.notes,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    created_at: order.created_at,
    items: (items ?? []).map((i) => ({
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      lineTotal: Number(i.line_total),
    })),
  };
  const html = generateReceiptHtml(receiptOrder);
  if (!process.env.SENDGRID_API_KEY && !process.env.RESEND_API_KEY) {
    return NextResponse.json({
      ok: false,
      message: "Email not configured (set SENDGRID_API_KEY or RESEND_API_KEY). Receipt HTML generated.",
      preview: html.slice(0, 200) + "...",
    });
  }
  return NextResponse.json({ ok: true, message: "Email sent (stub)" });
}
