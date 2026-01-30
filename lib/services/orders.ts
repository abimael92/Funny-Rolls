/**
 * Orders service – POS Phase 1 mock-only.
 * UI must use this service for order creation and reads; no direct order-store or localStorage access.
 */

import type { CartItem, Order, OrderItem } from "../types";
import {
	DEFAULT_TAX_RATE,
	lineTotal,
	saleSubtotalFromItems,
	saleTaxFromSubtotal,
	saleTotalFromSubtotal,
} from "../calculations";
import * as store from "../order-store";

/**
 * Build order items and totals from cart using centralized calculations.
 * No duplication of pricing logic.
 */
function cartToOrderPayload(cart: CartItem[]): Omit<Order, "id" | "createdAt"> {
	const items: OrderItem[] = cart.map((item) => ({
		productId: item.id,
		productName: item.name,
		quantity: item.quantity,
		unitPrice: item.price,
		lineTotal: lineTotal(item.quantity, item.price),
	}));
	const subtotal = saleSubtotalFromItems(items);
	const tax = saleTaxFromSubtotal(subtotal, DEFAULT_TAX_RATE);
	const total = saleTotalFromSubtotal(subtotal, DEFAULT_TAX_RATE);
	return {
		items,
		subtotal,
		tax,
		total,
		status: "completed", // mock payment successful
	};
}

/**
 * Create an order from the current cart and persist it.
 * Returns the created order (mock payment successful).
 */
export function createOrderFromCart(cart: CartItem[]): Order {
	const payload = cartToOrderPayload(cart);
	return store.createOrder(payload);
}

/**
 * Create and persist an order (e.g. for future use).
 */
export function createOrder(
	order: Omit<Order, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Order {
	return store.createOrder(order);
}

/**
 * Get a single order by id.
 */
export function getOrderById(id: string): Order | null {
	return store.getOrderById(id);
}

/**
 * List all orders (newest first).
 */
export function listOrders(): Order[] {
	return store.listOrders();
}

/** Cart totals using centralized tax rate and calculations. */
export interface CartTotals {
	subtotal: number;
	tax: number;
	total: number;
}

/**
 * Compute subtotal, tax, and total for a cart. Use for display only; no persistence.
 */
export function getCartTotals(cart: CartItem[]): CartTotals {
	const items = cart.map((c) => ({ quantity: c.quantity, unitPrice: c.price }));
	const subtotal = saleSubtotalFromItems(items);
	const tax = saleTaxFromSubtotal(subtotal, DEFAULT_TAX_RATE);
	const total = saleTotalFromSubtotal(subtotal, DEFAULT_TAX_RATE);
	return { subtotal, tax, total };
}
