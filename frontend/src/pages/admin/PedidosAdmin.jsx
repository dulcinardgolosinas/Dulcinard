import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { ORDER_STATUS_LABELS } from "../../components/ui/Badge";
import { formatCurrency } from "../../lib/format";
import { buildAdminOrderWhatsappHref } from "../../lib/whatsapp";
import { WhatsappIcon } from "../../components/ui/WhatsappIcon";
import { toastSuccess, toastError } from "../../lib/alerts";

const STATUSES = Object.keys(ORDER_STATUS_LABELS);

const STATUS_SELECT_TONES = {
  pendiente: "border-ink-200 bg-white text-ink-600",
  confirmado: "border-brand-200 bg-brand-50 text-brand-700",
  en_preparacion: "border-brand-200 bg-brand-50 text-brand-700",
  enviado: "border-brand-200 bg-brand-50 text-brand-700",
  entregado: "border-brand-500 bg-brand-600 text-white",
  cancelado: "border-ink-300 bg-ink-100 text-ink-500"
};

function StatusSelect({ order, onChanged }) {
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    const nextStatus = e.target.value;
    if (nextStatus === order.status) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, { status: nextStatus });
      onChanged(data);
      toastSuccess(`Pedido marcado como "${ORDER_STATUS_LABELS[nextStatus]}"`);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos actualizar el estado del pedido"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={order.status}
      onChange={handleChange}
      disabled={saving}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none disabled:opacity-50 ${
        STATUS_SELECT_TONES[order.status] || STATUS_SELECT_TONES.pendiente
      }`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

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

  function handleStatusChanged(updated) {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, status: updated.status } : o)));
  }

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
              {orders.map((o) => {
                const whatsappHref = buildAdminOrderWhatsappHref(o);
                return (
                  <tr key={o._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">#{o._id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-ink-600">{o.user?.name || o.user?.email}</td>
                    <td className="px-4 py-3 text-ink-500">{new Date(o.createdAt).toLocaleDateString("es-AR")}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3">
                      <StatusSelect order={o} onChanged={handleStatusChanged} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {whatsappHref && (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Coordinar por WhatsApp"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-white transition-colors hover:bg-accent-700"
                          >
                            <WhatsappIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <Link to={`/admin/pedidos/${o._id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                          Ver detalle
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
