import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { PageLoader } from "../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "../components/ui/Badge";
import { formatCurrency } from "../lib/format";

export default function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/mine")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
      <h1 className="font-display text-3xl font-bold text-ink-900">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-ink-400">
          Todavía no hiciste ningún pedido.
          <div className="mt-3">
            <Link to="/catalogo" className="font-semibold text-brand-600 hover:underline">
              Ir al catálogo
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/pedidos/${order._id}`}
              className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-5 transition-shadow hover:shadow-card"
            >
              <div>
                <p className="text-sm font-semibold text-ink-900">Pedido #{order._id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-ink-400">{new Date(order.createdAt).toLocaleDateString("es-AR")}</p>
                <p className="mt-1 text-xs text-ink-500">{order.items.length} producto(s)</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-ink-900">{formatCurrency(order.total)}</p>
                <Badge tone={ORDER_STATUS_TONES[order.status]} className="mt-1">
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
