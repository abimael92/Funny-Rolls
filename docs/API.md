# Funny Rolls — API Reference

Base URL: same origin (e.g. `http://localhost:2000` in dev). All JSON request/response unless noted.

## Orders

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders/create` | Create order. Body: `{ items: [{ productId, productName?, quantity, unitPrice, lineTotal, recipeId? }], notes?, customerName?, customerPhone?, customerEmail? }`. Returns `{ id, order_number, status, subtotal, tax, total, createdAt }`. |
| GET | `/api/orders/[id]` | Get order with items. |
| PUT | `/api/orders/[id]/status` | Update status. Body: `{ status }`. Allowed: pending, paid, preparing, ready, completed, cancelled. |
| POST | `/api/orders/[id]/complete` | Complete order (set paid, create payment, decrement inventory). Body: `{ paymentMethod: "cash" \| "mock", amountReceived?, changeDue? }`. |
| GET | `/api/orders/history` | List orders. Query: `status`, `dateFrom`, `dateTo`, `limit`. |
| GET | `/api/orders/next-number` | Get next order number (e.g. FR-2025-00001). |

## Payments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments/create` | Create payment record. Body: `{ orderId, method, amount, status?, amountReceived?, changeDue?, idempotencyKey? }`. |
| POST | `/api/payments/create-intent` | Create Stripe PaymentIntent. Body: `{ orderId, amount }`. Returns `{ clientSecret, paymentIntentId }`. |
| POST | `/api/payments/webhook` | Stripe webhook (signature verified). Updates order + payment on `payment_intent.succeeded`. |

## Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inventory/check?ingredientId=&quantity=` | Check if stock >= quantity. Returns `{ sufficient: boolean }`. |
| POST | `/api/inventory/adjust` | Adjust stock. Body: `{ ingredientId, delta, type?, referenceId?, notes? }`. type: order \| production \| restock \| adjustment. |
| GET | `/api/inventory/alerts` | Low-stock items. Returns `{ items: [{ id, name, current_stock, reorder_level, unit }] }`. |
| GET | `/api/inventory/transactions` | List transactions. Query: `ingredientId`, `limit`. |

## Production

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/production/record` | Record batch. Body: `{ recipeId, recipeName?, batchCount, ingredientsUsed? }`. Decrements inventory per recipe ingredients. |
| GET | `/api/production/history` | List batches. Query: `startDate`, `endDate`, `limit`. |

## Kitchen

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/kitchen/orders` | Pending orders (paid, preparing). Query: `status` (comma-separated). Returns orders with items. |
| PUT | `/api/kitchen/orders/[id]/status` | Set status. Body: `{ status }`. Allowed: preparing, ready, completed. |

## Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/sales/daily?date=` | Daily sales (orderCount, totalSales, averageTicket, orders). |
| GET | `/api/reports/sales/monthly?year=&month=` | Monthly summary. |

## Receipts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/receipts/[orderId]/html` | Receipt as HTML. |
| GET | `/api/receipts/[orderId]/pdf` | Receipt as HTML (browser can print to PDF). |
| POST | `/api/receipts/[orderId]/email` | Send receipt by email (stub unless SendGrid/Resend configured). Body: `{ email }`. |
| POST | `/api/receipts/[orderId]/print` | Print stub; returns URL to HTML receipt. |
