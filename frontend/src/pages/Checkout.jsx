import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api, apiErrorMessage } from "../lib/api";
import { useCartStore } from "../store/cartStore";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { formatCurrency, UNIT_LABELS } from "../lib/format";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clear } = useCartStore();
  const config = useSiteConfigStore((s) => s.config);
  const [zones, setZones] = useState([]);
  const [error, setError] = useState("");
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { street: "", city: "", zone: "", notes: "" }
  });

  useEffect(() => {
    api.get("/shipping-zones").then(({ data }) => setZones(data));
  }, []);

  const selectedZoneId = watch("zone");
  const selectedZone = zones.find((z) => z._id === selectedZoneId);
  const shippingCost = selectedZone
    ? selectedZone.freeShippingFrom > 0 && total() >= selectedZone.freeShippingFrom
      ? 0
      : selectedZone.cost
    : config?.defaultShippingCost ?? 80;

  async function onSubmit(values) {
    setError("");
    try {
      const { data: order } = await api.post("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: values
      });
      const { data: pref } = await api.post(`/orders/${order._id}/pay`);
      clear();
      window.location.href = pref.initPoint;
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos generar tu pedido"));
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-ink-400">Tu carrito está vacío.</p>
        <Link to="/catalogo" className="mt-3 inline-block font-semibold text-brand-600">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
      <h1 className="font-display text-3xl font-bold text-ink-900">Finalizar pedido</h1>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="font-semibold text-ink-900">Datos de entrega</h2>
          <Select label="Zona de envío" {...register("zone", { required: true })}>
            <option value="">Seleccioná tu zona</option>
            {zones.map((z) => (
              <option key={z._id} value={z._id}>
                {z.name}
              </option>
            ))}
          </Select>
          <Input label="Dirección" placeholder="Calle y número" {...register("street", { required: true })} />
          <Input label="Localidad" {...register("city", { required: true })} />
          <Textarea label="Notas para la entrega (opcional)" rows={3} {...register("notes")} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="h-4 w-4" /> : "Confirmar y pagar con Mercado Pago"}
          </Button>
          <p className="text-xs text-ink-400">
            Al confirmar serás redirigido a Mercado Pago para completar el pago de forma segura.
          </p>
        </form>

        <div className="h-fit rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-ink-900">Resumen del pedido</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span className="text-ink-600">
                  {item.quantity} x {item.name} <span className="text-ink-400">({UNIT_LABELS[item.unit]})</span>
                </span>
                <span className="font-medium text-ink-900">{formatCurrency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>{formatCurrency(total())}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Envío</span>
              <span>{shippingCost > 0 ? formatCurrency(shippingCost) : "Gratis"}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-900">
              <span>Total</span>
              <span>{formatCurrency(total() + shippingCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
