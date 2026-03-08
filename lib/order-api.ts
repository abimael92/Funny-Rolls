/**
 * Client-side API for orders and payments. Use from UI; falls back to localStorage if API unavailable.
 */
import type { CartItem } from "./types";
import { getCartTotals } from "./services/orders";
import { lineTotal } from "./calculations";

const BASE = typeof window !== "undefined" ? "" : "http://localhost:2000";

export interface CreateOrderApiResult {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

export async function createOrderApi(
  cart: CartItem[],
  options?: { notes?: string; customerName?: string; customerPhone?: string; customerEmail?: string }
): Promise<CreateOrderApiResult | null> {
  const totals = getCartTotals(cart);
  const items = cart.map((c) => ({
    productId: c.id,
    productName: c.name,
    quantity: c.quantity,
    unitPrice: c.price,
    lineTotal: lineTotal(c.quantity, c.price),
    recipeId: (c as { recipe?: { id?: string } }).recipe?.id ?? null,
  }));
  try {
    const res = await fetch(`${BASE}/api/orders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        notes: options?.notes,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        customerEmail: options?.customerEmail,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      order_number: data.order_number,
      status: data.status,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      createdAt: data.createdAt ?? data.created_at,
    };
  } catch {
    return null;
  }
}

export async function updateOrderStatusApi(orderId: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface CompleteOrderPayload {
  paymentMethod: "cash" | "mock";
  amountReceived?: number;
  changeDue?: number;
}

export async function completeOrderApi(orderId: string, payload: CompleteOrderPayload): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/orders/${orderId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: payload.paymentMethod,
        amountReceived: payload.amountReceived,
        changeDue: payload.changeDue,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface CreatePaymentApiPayload {
  method: "cash" | "mock";
  amount: number;
  amountReceived?: number;
  changeDue?: number;
}

export async function createPaymentApi(
  orderId: string,
  payload: CreatePaymentApiPayload
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/payments/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        method: payload.method,
        amount: payload.amount,
        status: "paid",
        amountReceived: payload.amountReceived,
        changeDue: payload.changeDue,
        idempotencyKey: `order-${orderId}-pay`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
