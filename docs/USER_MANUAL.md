# Funny Rolls — User Manual (POS)

## Customer flow

1. **Browse:** Open the site; see menu (products from catalog + recipes from DB).
2. **Add to cart:** Click add on a product; adjust quantity in cart.
3. **Checkout:** Open cart, add optional order notes, click **Pagar**.
4. **Payment:** Choose **Efectivo** (enter amount received; change is shown) or **Completar venta (sin efectivo)**. Click **Completar venta**.
5. **Confirmation:** Cart clears; order is saved. If the backend is configured, you get an order number (e.g. FR-2025-00001) and inventory is updated.

## Daily summary

- In the navbar, click **Resumen** to see today’s order count, total sales, and average ticket (from localStorage or DB depending on configuration).

## Kitchen display

- Open **/kitchen** (e.g. `https://yoursite.com/kitchen`).
- View pending orders (paid / preparing) with items and notes.
- Use **En preparación** → **Listo** → **Entregado** to update status. List refreshes every 10 seconds.

## Receipts

- **HTML:** Open `/api/receipts/[orderId]/html` in a browser (replace `[orderId]` with the order UUID).
- **Print:** Use the browser’s Print from that page, or call POST `/api/receipts/[orderId]/print` for the URL.

## Calculator (costs)

- Go to **Calculadora** (or `/recipe-calculator`).
- Manage ingredients and recipes; record production. Local data can be synced with Supabase if configured.
