import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.orderId;
    if (orderId && supabaseAdmin) {
      await supabaseAdmin.from("orders").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", orderId);
      const { data: existing } = await supabaseAdmin.from("payments").select("id").eq("order_id", orderId).maybeSingle();
      if (existing) {
        await supabaseAdmin.from("payments").update({ status: "paid", gateway_reference: pi.id }).eq("order_id", orderId);
      } else {
        await supabaseAdmin.from("payments").insert({
          order_id: orderId,
          method: "card",
          amount: (pi.amount ?? 0) / 100,
          status: "paid",
          gateway_reference: pi.id,
          idempotency_key: `stripe-${pi.id}`,
        });
      }
    }
  }
  return NextResponse.json({ received: true });
}
