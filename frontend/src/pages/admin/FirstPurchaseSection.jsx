import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Gift } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, resultAlert } from "../../lib/alerts";
import { useSiteConfigStore } from "../../store/siteConfigStore";

const schema = z.object({
  enabled: z.boolean(),
  percent: z.coerce
    .number({ message: "Poné un número" })
    .int("Tiene que ser un número entero")
    .min(1, "Tiene que ser 1 o más")
    .max(90, "Como máximo 90")
});

const valuesFrom = (config) => ({
  enabled: config?.firstPurchaseDiscount?.enabled !== false,
  percent: config?.firstPurchaseDiscount?.percent ?? 20
});

/** Descuento automático en la primera compra de cada cliente registrado. */
export function FirstPurchaseSection({ config, onSaved }) {
  const setGlobalConfig = useSiteConfigStore((s) => s.setConfig);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({ resolver: zodResolver(schema), defaultValues: valuesFrom(config) });
  const enabled = watch("enabled");

  useEffect(() => reset(valuesFrom(config)), [config, reset]);

  async function onSubmit(values) {
    const confirmed = await confirmAction({
      title: "¿Guardar el descuento de primera compra?",
      text: values.enabled
        ? `Cada cliente registrado va a tener ${values.percent}% de descuento en su primera compra.`
        : "Los clientes nuevos ya no van a tener descuento en su primera compra.",
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;
    try {
      const { data } = await api.put("/site-config", { firstPurchaseDiscount: values });
      onSaved?.(data);
      setGlobalConfig(data);
      resultAlert({ title: "¡Listo!", text: values.enabled ? `Descuento de primera compra: ${values.percent}%.` : "Descuento de primera compra desactivado." });
    } catch (err) {
      resultAlert({ title: "No pudimos guardar", text: apiErrorMessage(err, "Probá de nuevo."), icon: "error" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Gift className="h-4 w-4 text-brand-600" /> Descuento en la primera compra
      </p>
      <p className="text-xs text-ink-500">
        Se aplica solo en el primer pedido de cada cliente con cuenta, y se suma a las promociones. Se da por usado cuando el
        pedido se paga (si el pago falla, no lo pierde). A quien entra sin cuenta se le avisa que registrándose lo obtiene.
      </p>
      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input type="checkbox" {...register("enabled")} className="h-4 w-4 accent-brand-600" />
        Activado
      </label>
      {enabled && (
        <Input label="Porcentaje de descuento (%)" type="number" min="1" max="90" {...register("percent")} error={errors.percent?.message} />
      )}
      <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : "Guardar"}
      </Button>
    </form>
  );
}
