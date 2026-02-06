/**
 * Mock order store with localStorage persistence.
 * Single source of truth for orders; no UI may access localStorage directly.
 * Used only via lib/services/orders.
 */

import type { Order } from "./types";

const ORDERS_KEY = "funny-rolls-orders";
const COUNTER_KEY = "funny-rolls-order-counter";

function readOrders(): Order[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(ORDERS_KEY);
		return raw ? (JSON.parse(raw) as Order[]) : [];
	} catch {
		return [];
	}
}

function writeOrders(orders: Order[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
	} catch {
		// ignore
	}
}

function nextOrderId(): string {
	if (typeof window === "undefined") return `order-${Math.random().toString(36).slice(2, 11)}`;
	try {
		const raw = localStorage.getItem(COUNTER_KEY);
		const count = raw ? Math.max(0, parseInt(raw, 10)) + 1 : 1;
		localStorage.setItem(COUNTER_KEY, String(count));
		return `order-${String(count).padStart(6, "0")}`;
	} catch {
		return `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}
}

/**
 * Create and persist an order. Assigns id and createdAt if missing.
 * Returns the persisted order.
 */
export function createOrder(order: Omit<Order, "id" | "createdAt"> & { id?: string; createdAt?: string }): Order {
	const id = order.id ?? nextOrderId();
	const createdAt = order.createdAt ?? new Date().toISOString();
	const full: Order = {
		id,
		items: order.items,
		subtotal: order.subtotal,
		tax: order.tax,
		total: order.total,
		status: order.status ?? "completed",
		createdAt,
		notes: order.notes,
		paymentMethod: order.paymentMethod,
		amountReceived: order.amountReceived,
		changeDue: order.changeDue,
		paymentId: order.paymentId,
	};
	const orders = readOrders();
	orders.push(full);
	writeOrders(orders);
	return full;
}

/**
 * Get a single order by id, or null if not found.
 */
export function getOrderById(id: string): Order | null {
	const orders = readOrders();
	return orders.find((o) => o.id === id) ?? null;
}

/**
 * List all orders (newest first).
 */
export function listOrders(): Order[] {
	const orders = readOrders();
	return [...orders].reverse();
}

/**
 * Update an existing order (e.g. set paymentId, status). Partial update.
 * Returns the updated order or null if not found.
 */
export function updateOrder(
	id: string,
	updates: Partial<Pick<Order, "status" | "paymentId" | "notes" | "paymentMethod" | "amountReceived" | "changeDue">>
): Order | null {
	const orders = readOrders();
	const index = orders.findIndex((o) => o.id === id);
	if (index === -1) return null;
	orders[index] = { ...orders[index]!, ...updates };
	writeOrders(orders);
	return orders[index]!;
}
