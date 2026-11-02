import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Banknote, CreditCard, Landmark } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../lib/api";
import { useCartStore } from "../store/cartStore";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { useAuthStore } from "../store/authStore";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { formatCurrency, UNIT_LABELS } from "../lib/format";
import { alphanumericField, nameField, phoneField } from "../lib/validators";
import { toastError, toastSuccess } from "../lib/alerts";
import { BankTransferInfo } from "../components/ui/BankTransferInfo";
import { Seo } from "../components/Seo";

const hasBankTransfer = (config) => Boolean(config?.bankTransfer?.alias || config?.bankTransfer?.cbu);

const schema = z.object({
  zone: z.string().min(1, "Elegí tu zona de envío"),
  street: alphanumericField("La dirección", { min: 3, max: 150 }),
  city: nameField("La localidad", { max: 80 }),
  phone: phoneField({ required: true }),
  savePhone: z.boolean().optional(),
  notes: z.string().trim().max(500, "Las notas no pueden superar los 500 caracteres").optional(),
  paymentMethod: z.enum(["mercado_pago", "transferencia", "efectivo"], { message: "Elegí un método de pago" })
});

const PAYMENT_OPTIONS = [
  {
    value: "mercado_pago",
    title: "Mercado Pago",
    description: "Tarjeta, débito o dinero en cuenta. Te redirigimos para pagar de forma segura.",
    Icon: CreditCard
  },
  {
    value: "transferencia",
    title: "Transferencia bancaria",
    description: "Transferís desde tu banco o billetera. Te mostramos el alias y el CBU.",
    Icon: Landmark
  },
  {
    value: "efectivo",
    title: "Efectivo",
    description: "Pagás al recibir o retirar el pedido. Lo confirmamos cuando recibamos el pago.",
    Icon: Banknote
  }
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clear, syncWithProducts } = useCartStore();
  const config = useSiteConfigStore((s) => s.config);
  const { user, updateUser } = useAuthStore();
  const [zones, setZones] = useState([]);
  const [error, setError] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      street: "",
      city: "",
      zone: "",
      phone: user?.phone || "",
      savePhone: false,
      notes: "",
      paymentMethod: "mercado_pago"
    }
  });
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    api.get("/shipping-zones").then(({ data }) => setZones(data));
  }, []);

  // Precios y stock reales del servidor: el carrito guardado en el navegador
  // puede estar desactualizado o editado a mano. (El backend igual recalcula
  // todo al crear el pedido; esto es para que el resumen muestre lo que se cobra.)
  useEffect(() => {
    const ids = useCartStore.getState().items.map((i) => i.productId);
    if (!ids.length) return;
    api
      .get("/products", { params: { ids: ids.join(","), limit: 100 } })
      .then(({ data }) => {
        const removed = syncWithProducts(data.items);
        if (removed.length) toastError(`Ya no están disponibles: ${removed.join(", ")}`);
      })
      .catch(() => {
        // si falla, el backend valida igual al confirmar
      });
  }, [syncWithProducts]);

  const selectedZoneId = watch("zone");
  const selectedZone = zones.find((z) => z._id === selectedZoneId);
  const shippingCost = selectedZone
    ? selectedZone.freeShippingFrom > 0 && total() >= selectedZone.freeShippingFrom
      ? 0
      : selectedZone.cost
    : config?.defaultShippingCost ?? 80;

  async function onSubmit({ savePhone, paymentMethod, ...values }) {
    setError("");
    let order;
    try {
      ({ data: order } = await api.post("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: values,
        paymentMethod
      }));
    } catch (err) {
      const message = apiErrorMessage(err, "No pudimos generar tu pedido");
      setError(message);
      toastError(message);
      return;
    }

    // Desde acá el pedido ya existe: en todas las salidas se vacía el carrito,
    // para que un reintento no genere un pedido duplicado.
    try {

      if (savePhone && values.phone !== user?.phone) {
        try {
          const { data } = await api.put("/auth/me", { phone: values.phone });
          updateUser(data.user);
          toastSuccess("Actualizamos tu teléfono de perfil");
        } catch {
          // no bloqueamos la confirmación del pedido si esto falla
        }
      }

      if (paymentMethod === "efectivo" || paymentMethod === "transferencia") {
        clear();
        navigate(`/pedidos/${order._id}?pago=${paymentMethod}`);
        return;
      }

      const { data: pref } = await api.post(`/orders/${order._id}/pay`);
      clear();
      window.location.href = pref.initPoint;
    } catch (err) {
      // El pedido quedó creado: se lleva al detalle, donde puede reintentar el pago.
      clear();
      toastError(apiErrorMessage(err, "Tu pedido se creó, pero no pudimos iniciar el pago. Reintentalo desde el pedido."));
      navigate(`/pedidos/${order._id}`);
    }
  }

  function onInvalid() {
    toastError("Completá todos los campos obligatorios");
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
      <Seo title="Finalizar compra" noIndex />
      <h1 className="font-display text-3xl font-bold text-ink-900">Finalizar pedido</h1>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          <h2 className="font-semibold text-ink-900">Datos de entrega</h2>
          <Select label="Zona de envío" {...register("zone")} error={errors.zone?.message}>
            <option value="">Seleccioná tu zona</option>
            {zones.map((z) => (
              <option key={z._id} value={z._id}>
                {z.name}
              </option>
            ))}
          </Select>
          <Input label="Dirección" placeholder="Calle y número" {...register("street")} error={errors.street?.message} />
          <Input label="Localidad" {...register("city")} error={errors.city?.message} />

          <div>
            <Input label="Teléfono de contacto" {...register("phone")} error={errors.phone?.message} />
            {user?.phone && (
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                <input type="checkbox" {...register("savePhone")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                Actualizar el teléfono guardado en mi perfil con este número
              </label>
            )}
          </div>

          <Textarea label="Notas para la entrega (opcional)" rows={3} {...register("notes")} error={errors.notes?.message} />

          <fieldset className="pt-2">
            <legend className="mb-2 font-semibold text-ink-900">Método de pago</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_OPTIONS.filter((o) => o.value !== "transferencia" || hasBankTransfer(config)).map(({ value, title, description, Icon }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${
                    paymentMethod === value ? "border-brand-600 bg-brand-50" : "border-ink-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <input type="radio" value={value} {...register("paymentMethod")} className="mt-1 h-4 w-4 accent-brand-600" />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <Icon className="h-4 w-4 text-brand-600" strokeWidth={2} />
                      {title}
                    </span>
                    <span className="mt-1 block text-xs text-ink-600">{description}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.paymentMethod && <p className="mt-1 text-xs text-danger-600">{errors.paymentMethod.message}</p>}
            {paymentMethod === "transferencia" && <BankTransferInfo bank={config?.bankTransfer} className="mt-3" />}
          </fieldset>

          {error && <p className="text-sm text-danger-600">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Spinner className="h-4 w-4" />
            ) : paymentMethod === "efectivo" ? (
              "Confirmar pedido (pago en efectivo)"
            ) : paymentMethod === "transferencia" ? (
              "Confirmar pedido (pago por transferencia)"
            ) : (
              "Confirmar y pagar con Mercado Pago"
            )}
          </Button>
          <p className="text-xs text-ink-500">
            {paymentMethod === "efectivo"
              ? "Tu pedido queda pendiente de pago hasta que confirmemos el cobro en efectivo. Te contactamos para coordinar."
              : paymentMethod === "transferencia"
              ? "Tu pedido queda pendiente de pago hasta que recibamos la transferencia. Después de confirmar vas a ver de nuevo los datos para transferir."
              : "Al confirmar serás redirigido a Mercado Pago para completar el pago de forma segura."}
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
