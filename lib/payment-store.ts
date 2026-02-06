/**
 * Mock payment store with localStorage persistence.
 * Single source of truth for payments; no UI may access directly.
 * Used only via lib/services/payments (or orders).
 */

import type { Payment } from "./types";

const PAYMENTS_KEY = "funny-rolls-payments";

function readPayments(): Payment[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(PAYMENTS_KEY);
		return raw ? (JSON.parse(raw) as Payment[]) : [];
	} catch {
		return [];
	}
}

function writePayments(payments: Payment[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
	} catch {
		// ignore
	}
}

/** Deterministic id: one payment per order. */
function paymentIdForOrder(orderId: string): string {
	return `payment-${orderId}`;
}

/**
 * Create a payment. Idempotent per orderId: if a payment already exists for this order,
 * return it without creating a duplicate. Otherwise create with id = payment-{orderId}.
 */
export function createPayment(
	payment: Omit<Payment, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Payment {
	const orderId = payment.orderId;
	const id = payment.id ?? paymentIdForOrder(orderId);
	const existing = getPaymentByOrderId(orderId);
	if (existing) return existing;

	const createdAt = payment.createdAt ?? new Date().toISOString();
	const full: Payment = {
		id,
		orderId,
		method: payment.method,
		amount: payment.amount,
		status: payment.status ?? "initiated",
		createdAt,
		amountReceived: payment.amountReceived,
		changeDue: payment.changeDue,
	};
	const payments = readPayments();
	payments.push(full);
	writePayments(payments);
	return full;
}

/**
 * Get payment by id.
 */
export function getPaymentById(id: string): Payment | null {
	const payments = readPayments();
	return payments.find((p) => p.id === id) ?? null;
}

/**
 * Get the (single) payment for an order. Order has at most one active payment.
 */
export function getPaymentByOrderId(orderId: string): Payment | null {
	const payments = readPayments();
	return payments.find((p) => p.orderId === orderId) ?? null;
}

/**
 * Update an existing payment. Returns updated payment or null if not found.
 */
export function updatePayment(
	id: string,
	updates: Partial<Pick<Payment, "status" | "amountReceived" | "changeDue" | "method">>
): Payment | null {
	const payments = readPayments();
	const index = payments.findIndex((p) => p.id === id);
	if (index === -1) return null;
	payments[index] = { ...payments[index]!, ...updates };
	writePayments(payments);
	return payments[index]!;
}
