/**
 * Mock Sales and PaymentIntents. Uses lib/calculations for totals and tax.
 */

import type { Product, Sale, SaleItem, PaymentIntent } from "./types";
import {
	DEFAULT_TAX_RATE,
	DEFAULT_CURRENCY,
	lineTotal,
	saleSubtotalFromItems,
	saleTaxFromSubtotal,
	saleTotalFromSubtotal,
} from "./calculations";

function saleItem(
	productId: number,
	productName: string,
	quantity: number,
	unitPrice: number
): SaleItem {
	return {
		productId,
		productName,
		quantity,
		unitPrice,
		lineTotal: lineTotal(quantity, unitPrice),
	};
}

function paymentIntent(
	id: string,
	saleId: string,
	amount: number,
	status: PaymentIntent["status"],
	createdAt: string
): PaymentIntent {
	return {
		id,
		saleId,
		amount,
		currency: DEFAULT_CURRENCY,
		status,
		provider: "mock",
		createdAt,
	};
}

/**
 * Build mock Sales and PaymentIntents from a product list.
 * Totals use centralized tax and calculation helpers.
 */
export function buildMockSalesAndPaymentIntents(
	products: Product[]
): { sales: Sale[]; paymentIntents: PaymentIntent[] } {
	const available = products.filter((p) => p.available);
	if (available.length === 0) {
		return { sales: [], paymentIntents: [] };
	}

	const sales: Sale[] = [];
	const paymentIntents: PaymentIntent[] = [];

	// Sale 1: single item
	const p1 = available[0]!;
	const items1: SaleItem[] = [
		saleItem(p1.id, p1.name, 2, p1.price),
	];
	const sub1 = saleSubtotalFromItems(items1);
	const tax1 = saleTaxFromSubtotal(sub1, DEFAULT_TAX_RATE);
	const total1 = saleTotalFromSubtotal(sub1, DEFAULT_TAX_RATE);
	const createdAt1 = "2025-01-15T10:30:00.000Z";
	sales.push({
		id: "sale-mock-1",
		status: "completed",
		items: items1,
		subtotal: sub1,
		taxRate: DEFAULT_TAX_RATE,
		taxAmount: tax1,
		total: total1,
		currency: DEFAULT_CURRENCY,
		createdAt: createdAt1,
		customerName: "Cliente Mock 1",
		customerPhone: "+526141234567",
	});
	paymentIntents.push(
		paymentIntent("pi-mock-1", "sale-mock-1", total1, "succeeded", createdAt1)
	);

	// Sale 2: multiple items
	const [a, b] = available;
	if (a && b && a.id !== b.id) {
		const items2: SaleItem[] = [
			saleItem(a.id, a.name, 1, a.price),
			saleItem(b.id, b.name, 3, b.price),
		];
		const sub2 = saleSubtotalFromItems(items2);
		const tax2 = saleTaxFromSubtotal(sub2, DEFAULT_TAX_RATE);
		const total2 = saleTotalFromSubtotal(sub2, DEFAULT_TAX_RATE);
		const createdAt2 = "2025-01-16T14:00:00.000Z";
		sales.push({
			id: "sale-mock-2",
			status: "completed",
			items: items2,
			subtotal: sub2,
			taxRate: DEFAULT_TAX_RATE,
			taxAmount: tax2,
			total: total2,
			currency: DEFAULT_CURRENCY,
			createdAt: createdAt2,
			customerName: "Cliente Mock 2",
		});
		paymentIntents.push(
			paymentIntent("pi-mock-2", "sale-mock-2", total2, "succeeded", createdAt2)
		);
	}

	// Sale 3: pending
	const p3 = available[0]!;
	const items3: SaleItem[] = [saleItem(p3.id, p3.name, 4, p3.price)];
	const sub3 = saleSubtotalFromItems(items3);
	const tax3 = saleTaxFromSubtotal(sub3, DEFAULT_TAX_RATE);
	const total3 = saleTotalFromSubtotal(sub3, DEFAULT_TAX_RATE);
	const createdAt3 = "2025-01-17T09:15:00.000Z";
	sales.push({
		id: "sale-mock-3",
		status: "pending",
		items: items3,
		subtotal: sub3,
		taxRate: DEFAULT_TAX_RATE,
		taxAmount: tax3,
		total: total3,
		currency: DEFAULT_CURRENCY,
		createdAt: createdAt3,
		notes: "Pedido para recoger",
	});
	paymentIntents.push(
		paymentIntent("pi-mock-3", "sale-mock-3", total3, "pending", createdAt3)
	);

	return { sales, paymentIntents };
}
