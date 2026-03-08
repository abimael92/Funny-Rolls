import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { orderId, amount } = body as { orderId: string; amount: number };
    if (!orderId || amount == null || amount <= 0) {
      return NextResponse.json({ error: "orderId and positive amount required" }, { status: 400 });
    }
    const amountCents = Math.round(amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "mxn",
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (e) {
    console.error("create-intent error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
