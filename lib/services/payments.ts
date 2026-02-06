/**
 * Payments service – Phase 2 payment-ready, mock execution only.
 * UI must use this for checkout and payment; no direct store access.
 */

import type { CartItem, Order, OrderItem } from "../types";
import {
	// _DEFAULT_TAX_RATE,
	lineTotal,
	// _saleSubtotalFromItems,
	// _saleTaxFromSubtotal,
	// _saleTotalFromSubtotal,
} from '../calculations';
import type { CartTotals } from "./orders";
import { getCartTotals } from "./orders";
import * as orderStore from "../order-store";
import * as paymentStore from "../payment-store";

/** Stable order id from cart content so retries reuse the same order. */
function computeOrderIdFromCart(cart: CartItem[], totals: CartTotals): string {
	const key = JSON.stringify({
		items: [...cart]
			.sort((a, b) => a.id - b.id)
			.map((c) => ({ id: c.id, q: c.quantity, p: c.price })),
		sub: totals.subtotal,
		tot: totals.total,
	});
	let h = 0;
	for (let i = 0; i < key.length; i++) {
		h = (h << 5) - h + key.charCodeAt(i);
		h |= 0;
	}
	return `order-${(h >>> 0).toString(36)}`;
}

function buildPendingOrderFromCart(
	cart: CartItem[],
	totals: CartTotals,
	orderId: string
): Omit<Order, "id" | "createdAt"> & { id: string } {
	const items: OrderItem[] = cart.map((item) => ({
		productId: item.id,
		productName: item.name,
		quantity: item.quantity,
		unitPrice: item.price,
		lineTotal: lineTotal(item.quantity, item.price),
	}));
	return {
		id: orderId,
		items,
		subtotal: totals.subtotal,
		tax: totals.tax,
		total: totals.total,
		status: "pending",
	};
}

export interface StartCheckoutResult {
	orderId: string;
	paymentId: string;
	/** True if this order was already completed (retry / idempotency). */
	alreadyPaid: boolean;
	paymentStatus: "initiated" | "authorized" | "paid" | "failed";
}

/**
 * Start checkout: get or create Order + Payment (idempotent per cart).
 * Call when user clicks "Pagar". Re-clicking with same cart reuses existing order/payment.
 */
export function startCheckout(cart: CartItem[]): StartCheckoutResult {
	const totals = getCartTotals(cart);
	const orderId = computeOrderIdFromCart(cart, totals);

	const existingOrder = orderStore.getOrderById(orderId);
	if (existingOrder) {
		const payment = paymentStore.getPaymentByOrderId(orderId);
		const alreadyPaid = existingOrder.status === "completed" && payment?.status === "paid";
		return {
			orderId,
			paymentId: payment?.id ?? "",
			alreadyPaid: !!alreadyPaid,
			paymentStatus: payment?.status ?? "initiated",
		};
	}

	const orderPayload = buildPendingOrderFromCart(cart, totals, orderId);
	const order = orderStore.createOrder({ ...orderPayload, id: orderId });
	const payment = paymentStore.createPayment({
		orderId: order.id,
		method: "cash",
		amount: order.total,
		status: "initiated",
	});
	orderStore.updateOrder(orderId, { paymentId: payment.id });

	return {
		orderId,
		paymentId: payment.id,
		alreadyPaid: false,
		paymentStatus: "initiated",
	};
}

export interface CompletePaymentPayload {
	notes?: string;
	paymentMethod: "cash" | "mock";
	amountReceived?: number;
	changeDue?: number;
}

/**
 * Complete payment for an order (cash or mock). Idempotent: if already paid, no-op and return success.
 */
export function completePayment(orderId: string, payload: CompletePaymentPayload): void {
	const payment = paymentStore.getPaymentByOrderId(orderId);
	if (!payment) return;
	if (payment.status === "paid") return;

	paymentStore.updatePayment(payment.id, {
		status: "paid",
		method: payload.paymentMethod,
		amountReceived: payload.amountReceived,
		changeDue: payload.changeDue,
	});
	orderStore.updateOrder(orderId, {
		status: "completed",
		notes: payload.notes?.trim() || undefined,
		paymentMethod: payload.paymentMethod,
		amountReceived: payload.amountReceived,
		changeDue: payload.changeDue,
	});
}

/**
 * Get payment status for an order (for display). Read-only.
 */
export function getPaymentStatus(orderId: string): {
	status: "initiated" | "authorized" | "paid" | "failed";
	paymentId: string | null;
} | null {
	const payment = paymentStore.getPaymentByOrderId(orderId);
	if (!payment) return null;
	return { status: payment.status, paymentId: payment.id };
}
