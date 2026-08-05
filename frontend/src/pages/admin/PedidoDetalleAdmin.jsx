import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "../../components/ui/Badge";
import { formatCurrency, UNIT_LABELS } from "../../lib/format";
import { toastSuccess, toastError } from "../../lib/alerts";

const STATUSES = Object.keys(ORDER_STATUS_LABELS);

export default function PedidoDetalleAdmin() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status) {
    setSaving(true);
    try {
      const { data } = await api.put(`/orders/${id}/status`, { status });
      setOrder(data);
      toastSuccess(`Pedido marcado como "${ORDER_STATUS_LABELS[status]}"`);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos actualizar el estado del pedido"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!order) return <p className="text-ink-400">Pedido no encontrado.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/pedidos" className="text-sm font-semibold text-ink-500 hover:text-brand-600">
        ← Pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Pedido #{order._id.slice(-6).toUpperCase()}</h1>
        <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="mb-2 text-sm font-semibold text-ink-900">Cliente</p>
          <p className="text-sm text-ink-700">{order.user?.name}</p>
          <p className="text-sm text-ink-500">{order.user?.email}</p>
          <p className="text-sm text-ink-500">{order.user?.phone}</p>
          {order.user?.businessName && <p className="text-sm text-ink-500">{order.user.businessName}</p>}
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="mb-2 text-sm font-semibold text-ink-900">Entrega</p>
          <p className="text-sm text-ink-700">{order.shippingAddress?.street}</p>
          <p className="text-sm text-ink-500">{order.shippingAddress?.city}</p>
          {order.shippingAddress?.notes && <p className="mt-1 text-xs text-ink-400">{order.shippingAddress.notes}</p>}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Cambiar estado del pedido</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={saving}
              onClick={() => updateStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                order.status === s ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600 hover:border-brand-300"
              }`}
            >
              {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 divide-y divide-ink-50 rounded-2xl border border-ink-100 bg-white">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">{item.name}</p>
              <p className="text-xs text-ink-400">
                {item.quantity} x {UNIT_LABELS[item.unit] || item.unit} · {formatCurrency(item.unitPrice)}
              </p>
            </div>
            <p className="font-semibold text-ink-900">{formatCurrency(item.subtotal)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-1.5 rounded-2xl bg-ink-50 p-5 text-sm">
        <div className="flex justify-between text-ink-600">
          <span>Subtotal</span>
          <span>{formatCurrency(order.itemsTotal)}</span>
        </div>
        <div className="flex justify-between text-ink-600">
          <span>Envío</span>
          <span>{formatCurrency(order.shippingCost)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-900">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <p className="pt-2 text-xs text-ink-400">Pago: {order.paymentMethod} · Estado del pago: {order.paymentStatus}</p>
      </div>
    </div>
  );
}
