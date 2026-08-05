import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "../../components/ui/Badge";
import { formatCurrency } from "../../lib/format";

const STATUSES = Object.keys(ORDER_STATUS_LABELS);

export default function PedidosAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const load = useCallback(async (s = status) => {
    setLoading(true);
    const { data } = await api.get("/orders", { params: { status: s, limit: 50 } });
    setOrders(data.items);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Pedidos</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => { setStatus(""); load(""); }}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!status ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600"}`}
        >
          Todos
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); load(s); }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${status === s ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600"}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900">#{o._id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-ink-600">{o.user?.name || o.user?.email}</td>
                  <td className="px-4 py-3 text-ink-500">{new Date(o.createdAt).toLocaleDateString("es-AR")}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={ORDER_STATUS_TONES[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/pedidos/${o._id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                    No hay pedidos en este estado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
