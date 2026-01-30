/**
 * Orders service – POS mock-only. UI must use this for order creation and reads.
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

export interface CreateOrderPayload {
	notes?: string;
	paymentMethod: "cash" | "mock";
	amountReceived?: number;
	changeDue?: number;
}

function cartToOrderPayload(
	cart: CartItem[],
	payload: CreateOrderPayload
): Omit<Order, "id" | "createdAt"> {
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
		status: "completed",
		notes: payload.notes?.trim() || undefined,
		paymentMethod: payload.paymentMethod,
		amountReceived: payload.amountReceived,
		changeDue: payload.changeDue,
	};
}

/**
 * Create an order from the current cart with notes and payment info. Persist and return order.
 */
export function createOrderFromCart(
	cart: CartItem[],
	payload: CreateOrderPayload
): Order {
	const orderPayload = cartToOrderPayload(cart, payload);
	return store.createOrder(orderPayload);
}

export function createOrder(
	order: Omit<Order, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Order {
	return store.createOrder(order);
}

export function getOrderById(id: string): Order | null {
	return store.getOrderById(id);
}

export function listOrders(): Order[] {
	return store.listOrders();
}

export interface CartTotals {
	subtotal: number;
	tax: number;
	total: number;
}

/**
 * Compute subtotal, tax, and total for a cart (display only).
 */
export function getCartTotals(cart: CartItem[]): CartTotals {
	const items = cart.map((c) => ({ quantity: c.quantity, unitPrice: c.price }));
	const subtotal = saleSubtotalFromItems(items);
	const tax = saleTaxFromSubtotal(subtotal, DEFAULT_TAX_RATE);
	const total = saleTotalFromSubtotal(subtotal, DEFAULT_TAX_RATE);
	return { subtotal, tax, total };
}

export interface DailySalesSummary {
	orderCount: number;
	totalSales: number;
	averageTicket: number;
}

/**
 * Read-only daily sales summary (today's orders). Computed from OrderStore via service.
 */
export function getDailySalesSummary(): DailySalesSummary {
	const orders = listOrders();
	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
	const todayOrders = orders.filter((o) => {
		const d = o.createdAt.slice(0, 10);
		return d === todayStr;
	});
	const totalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
	const orderCount = todayOrders.length;
	const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;
	return { orderCount, totalSales, averageTicket };
}
