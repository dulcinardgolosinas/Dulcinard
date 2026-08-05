import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "../../components/ui/Badge";
import { formatCurrency } from "../../lib/format";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, users: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    async function load() {
      const [products, users, orders] = await Promise.all([
        api.get("/products", { params: { limit: 1, all: "true" } }),
        api.get("/users", { params: { limit: 1 } }),
        api.get("/orders", { params: { limit: 8 } })
      ]);
      const pending = orders.data.items.filter((o) => o.status === "pendiente").length;
      setStats({ products: products.data.total, users: users.data.total, pendingOrders: pending });
      setRecentOrders(orders.data.items);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Productos" value={stats.products} />
        <StatCard label="Usuarios registrados" value={stats.users} />
        <StatCard label="Pedidos pendientes" value={stats.pendingOrders} />
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-ink-900">Últimos pedidos</h2>
          <Link to="/admin/pedidos" className="text-sm font-semibold text-brand-600 hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-ink-50">
          {recentOrders.map((order) => (
            <Link
              key={order._id}
              to={`/admin/pedidos/${order._id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-ink-50"
            >
              <div>
                <p className="text-sm font-semibold text-ink-900">#{order._id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-ink-400">{order.user?.name || order.user?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink-900">{formatCurrency(order.total)}</span>
                <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
              </div>
            </Link>
          ))}
          {recentOrders.length === 0 && <p className="px-5 py-6 text-sm text-ink-400">Todavía no hay pedidos.</p>}
        </div>
      </div>
    </div>
  );
}
