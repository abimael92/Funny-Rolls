"use client";

import { useEffect, useState } from "react";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  notes?: string | null;
  created_at: string;
  items: Array<{ product_name: string | null; quantity: number }>;
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/kitchen/orders?status=paid,preparing");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchOrders();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-amber-800">Cargando pedidos…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <h1 className="text-2xl font-bold text-amber-900 mb-4">Cocina — Pedidos</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`rounded-xl border-2 p-4 ${
              order.status === "preparing"
                ? "border-amber-500 bg-amber-100"
                : "border-amber-200 bg-white"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-lg">{order.order_number}</span>
              <span className="text-sm text-gray-600">
                {new Date(order.created_at).toLocaleTimeString("es-MX")}
              </span>
            </div>
            <ul className="list-disc list-inside mb-2 text-sm">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.quantity}x {item.product_name ?? "—"}
                </li>
              ))}
            </ul>
            {order.notes && (
              <p className="text-sm text-amber-800 mb-2 italic">Notas: {order.notes}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              {order.status === "paid" && (
                <button
                  className="px-3 py-1.5 rounded bg-amber-600 text-white text-sm"
                  onClick={() => updateStatus(order.id, "preparing")}
                >
                  En preparación
                </button>
              )}
              {(order.status === "paid" || order.status === "preparing") && (
                <button
                  className="px-3 py-1.5 rounded bg-green-600 text-white text-sm"
                  onClick={() => updateStatus(order.id, "ready")}
                >
                  Listo
                </button>
              )}
              {order.status === "ready" && (
                <button
                  className="px-3 py-1.5 rounded bg-gray-600 text-white text-sm"
                  onClick={() => updateStatus(order.id, "completed")}
                >
                  Entregado
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {orders.length === 0 && (
        <p className="text-amber-800 text-center py-8">No hay pedidos pendientes.</p>
      )}
    </div>
  );
}
