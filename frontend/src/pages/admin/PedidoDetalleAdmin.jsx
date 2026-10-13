import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Banknote } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  formatCurrency,
  UNIT_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  CONFIRMED_ORDER_STATUSES
} from "../../lib/format";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { buildAdminOrderWhatsappHref } from "../../lib/whatsapp";
import { WhatsappIcon } from "../../components/ui/WhatsappIcon";

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

  async function confirmPayment() {
    const isCash = order.paymentMethod === "efectivo";
    const confirmed = await confirmAction({
      title: "¿Confirmar pago?",
      text: `Vas a registrar que recibiste ${formatCurrency(order.total)}${isCash ? " en efectivo" : ""}. Se descontará el stock y el pedido pasará a "Confirmado".`,
      confirmText: "Sí, confirmar pago",
      icon: "question"
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const { data } = await api.put(`/orders/${id}/confirm-payment`);
      setOrder(data);
      toastSuccess("Pago confirmado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos confirmar el pago"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!order) return <p className="text-ink-500">Pedido no encontrado.</p>;

  const whatsappHref = buildAdminOrderWhatsappHref(order);
  const paid = order.paymentStatus === "aprobado";
  const canConfirmPayment = !paid && order.status !== "cancelado";

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Pedido #{order._id.slice(-6).toUpperCase()}</h1>
        <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
        >
          <WhatsappIcon className="h-4 w-4" />
          Coordinar con el cliente por WhatsApp
        </a>
      ) : (
        <p className="mt-4 text-xs text-ink-400">El cliente no tiene ningún teléfono cargado para coordinar por WhatsApp.</p>
      )}

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

      {order.stockIssue && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
          <div>
            <p className="font-semibold">El pago se aprobó pero no había stock suficiente</p>
            <p className="mt-0.5">
              {order.stockIssue}. Reponé el stock y pasá el pedido a "Confirmado", o cancelalo y gestioná la devolución del dinero.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">Pago</p>
            <p className="flex items-center gap-2 text-sm text-ink-700">
              {order.paymentMethod === "efectivo" && <Banknote className="h-4 w-4 text-ink-500" strokeWidth={2} />}
              {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
              <Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
              </Badge>
            </p>
            {order.paymentConfirmedAt && (
              <p className="mt-1 text-xs text-ink-500">
                Confirmado el {new Date(order.paymentConfirmedAt).toLocaleString("es-AR")}
                {order.paymentConfirmedBy?.name ? ` por ${order.paymentConfirmedBy.name}` : " por Mercado Pago"}
              </p>
            )}
            {order.mercadoPago?.paymentId && (
              <p className="mt-1 text-xs text-ink-500">ID de pago de Mercado Pago: {order.mercadoPago.paymentId}</p>
            )}
          </div>
          {canConfirmPayment && (
            <Button onClick={confirmPayment} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Confirmar pago recibido"}
            </Button>
          )}
        </div>
        {canConfirmPayment && order.paymentMethod === "efectivo" && (
          <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-600">
            Pedido en efectivo: queda pendiente de pago hasta que confirmes el cobro. Al confirmarlo se descuenta el stock y
            sigue el mismo flujo que un pago online.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Cambiar estado del pedido</p>
        {!paid && (
          <p className="mb-3 text-xs text-ink-500">Para avanzar el pedido primero hay que confirmar el pago.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={saving || (!paid && CONFIRMED_ORDER_STATUSES.includes(s))}
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
                {item.discountPercent > 0 && ` (${item.discountPercent}% OFF, antes ${formatCurrency(item.listPrice)})`}
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
      </div>
    </div>
  );
}
