/**
 * Server-side receipt generation. Used by API routes.
 */
export interface ReceiptOrder {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at: string;
  items: Array<{ productName?: string; quantity: number; unitPrice: number; lineTotal: number }>;
}

export function generateReceiptHtml(order: ReceiptOrder): string {
  const date = new Date(order.created_at).toLocaleString("es-MX");
  const rows = order.items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.productName ?? "—")}</td><td>${i.quantity}</td><td>$${Number(i.unitPrice).toFixed(2)}</td><td>$${Number(i.lineTotal).toFixed(2)}</td></tr>`
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><title>Recibo ${escapeHtml(order.order_number)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 400px; margin: 1rem auto; padding: 1rem; }
  h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { text-align: left; padding: 0.25rem 0.5rem; border-bottom: 1px solid #eee; }
  .total { font-weight: bold; font-size: 1.1rem; margin-top: 0.5rem; }
  .meta { color: #666; font-size: 0.875rem; }
</style>
</head>
<body>
  <h1>Funny Rolls</h1>
  <p class="meta">Pedido: ${escapeHtml(order.order_number)} &bull; ${date}</p>
  <table>
    <thead><tr><th>Producto</th><th>Cant</th><th>P.unit</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p>Subtotal: $${Number(order.subtotal).toFixed(2)}</p>
  <p>Impuesto: $${Number(order.tax).toFixed(2)}</p>
  <p class="total">Total: $${Number(order.total).toFixed(2)}</p>
  ${order.notes ? `<p class="meta">Notas: ${escapeHtml(order.notes)}</p>` : ""}
  <p class="meta">Gracias por su compra.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
