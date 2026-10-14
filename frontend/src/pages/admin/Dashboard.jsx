import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "../../components/ui/Badge";
import { formatCurrency } from "../../lib/format";

function StatCard({ label, value, to }) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink-900">{value}</p>
    </>
  );
  const className = "rounded-2xl border border-ink-100 bg-white p-5";
  return to ? (
    <Link to={to} className={`${className} transition-colors hover:border-brand-300`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, users: 0, pendingOrders: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    async function load() {
      const [products, users, orders, pending, lowStock] = await Promise.all([
        api.get("/products", { params: { limit: 1, all: "true" } }),
        api.get("/users", { params: { limit: 1 } }),
        api.get("/orders", { params: { limit: 8 } }),
        api.get("/orders", { params: { limit: 1, status: "pendiente" } }),
        api.get("/products", { params: { limit: 1, all: "true", stockStatus: "low" } })
      ]);
      setStats({
        products: products.data.total,
        users: users.data.total,
        pendingOrders: pending.data.total,
        lowStock: lowStock.data.total
      });
      setRecentOrders(orders.data.items);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>

      {stats.lowStock > 0 && (
        <Link
          to="/admin/productos?stock=low"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger-200 bg-danger-50 px-5 py-4 transition-colors hover:bg-danger-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-600 text-white">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-semibold text-danger-800">
                {stats.lowStock === 1
                  ? "1 producto necesita reposición"
                  : `${stats.lowStock} productos necesitan reposición`}
              </p>
              <p className="text-sm text-danger-700">Su stock está en o por debajo del stock mínimo.</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-danger-700 underline-offset-2 hover:underline">Ver productos a reponer →</span>
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Productos" value={stats.products} />
        <StatCard label="Usuarios registrados" value={stats.users} />
        <StatCard label="Pedidos pendientes de pago" value={stats.pendingOrders} to="/admin/pedidos?status=pendiente" />
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
