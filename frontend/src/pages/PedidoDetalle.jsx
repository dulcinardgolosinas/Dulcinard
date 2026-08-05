import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { PageLoader, Spinner } from "../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatCurrency, UNIT_LABELS } from "../lib/format";

const STEPS = ["pendiente", "confirmado", "en_preparacion", "enviado", "entregado"];

export default function PedidoDetalle() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/mine/${id}`)
      .then(async ({ data }) => {
        // El webhook de Mercado Pago no llega a un servidor en localhost; como
        // respaldo, si volvemos del checkout con éxito y el pedido todavía no
        // figura pagado, sincronizamos el estado usando el payment_id que MP
        // agrega a la URL de retorno.
        const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
        if (searchParams.get("pago") === "exito" && paymentId && data.paymentStatus !== "aprobado") {
          try {
            const { data: synced } = await api.post(`/orders/${id}/sync-payment?paymentId=${paymentId}`);
            setOrder(synced);
            return;
          } catch {
            // si falla la sincronización, mostramos igual el pedido tal como está
          }
        }
        setOrder(data);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handlePay() {
    setPaying(true);
    setPayError("");
    try {
      const { data } = await api.post(`/orders/${id}/pay`);
      window.location.href = data.initPoint;
    } catch (err) {
      setPayError(apiErrorMessage(err, "No pudimos iniciar el pago"));
      setPaying(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">
        Pedido no encontrado.{" "}
        <Link to="/pedidos" className="font-semibold text-brand-600">
          Volver
        </Link>
      </div>
    );
  }

  const pagoQuery = searchParams.get("pago");
  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Mis pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink-900">Pedido #{order._id.slice(-6).toUpperCase()}</h1>
        <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>
      <p className="text-sm text-ink-400">{new Date(order.createdAt).toLocaleString("es-AR")}</p>

      {pagoQuery === "exito" && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">¡Pago recibido! Estamos procesando tu pedido.</p>
      )}
      {pagoQuery === "error" && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Hubo un problema con el pago. Podés reintentarlo.</p>
      )}

      {order.status !== "cancelado" && (
        <div className="relative mt-10">
          <div className="absolute left-0 right-0 top-[7px] h-0.5 bg-ink-200" />
          <div
            className="absolute left-0 top-[7px] h-0.5 bg-brand-600 transition-all duration-500"
            style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
          />
          <div className="relative flex justify-between">
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className={`h-3.5 w-3.5 rounded-full ring-4 ring-white ${i <= stepIndex ? "bg-brand-600" : "bg-ink-200"}`} />
                <p className={`mt-2 max-w-[4.5rem] text-[11px] font-medium ${i <= stepIndex ? "text-ink-800" : "text-ink-300"}`}>
                  {ORDER_STATUS_LABELS[step]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 divide-y divide-ink-50 rounded-2xl border border-ink-100 bg-white">
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
          <span>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : "Gratis"}</span>
        </div>
        <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-900">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {order.paymentStatus !== "aprobado" && order.status !== "cancelado" && (
        <div className="mt-6">
          {payError && <p className="mb-3 text-sm text-red-600">{payError}</p>}
          <Button size="lg" onClick={handlePay} disabled={paying}>
            {paying ? <Spinner className="h-4 w-4" /> : "Pagar con Mercado Pago"}
          </Button>
        </div>
      )}
    </div>
  );
}
