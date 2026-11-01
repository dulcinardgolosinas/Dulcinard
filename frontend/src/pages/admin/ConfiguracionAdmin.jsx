import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { toastSuccess, toastError, confirmAction } from "../../lib/alerts";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { ThemeColorsSection } from "./ThemeColorsSection";
import { nameField, urlField, numberField, intField, DIGITS_ONLY_REGEX } from "../../lib/validators";

const schema = z.object({
  brandName: nameField("El nombre de la marca", { min: 2, max: 100 }),
  instagram: urlField({ label: "El link de Instagram" }),
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "El número de WhatsApp es obligatorio")
    .regex(DIGITS_ONLY_REGEX, "El número de WhatsApp solo puede contener números (sin 0 ni 15)")
    .min(6, "El número de WhatsApp debe tener entre 6 y 15 dígitos")
    .max(15, "El número de WhatsApp debe tener entre 6 y 15 dígitos"),
  whatsappMessage: z.string().trim().max(300, "El mensaje no puede superar los 300 caracteres").optional(),
  minPurchaseAmount: numberField("El monto mínimo de compra", { min: 0, max: 100000000 }),
  defaultShippingCost: numberField("El costo de envío por defecto", { min: 0, max: 1000000 }),
  freeShippingFrom: numberField("El monto de envío gratis", { min: 0, max: 100000000 }),
  deliveryEtaHours: intField("El tiempo de entrega mínimo", { min: 1, max: 720 }),
  deliveryEtaMaxHours: intField("El tiempo de entrega máximo", { min: 1, max: 720 }),
  bankTransfer: z.object({
    alias: z
      .string()
      .trim()
      .regex(/^([a-zA-Z0-9.-]{6,20})?$/, "El alias debe tener entre 6 y 20 caracteres (letras, números, puntos o guiones)"),
    cbu: z
      .string()
      .trim()
      .regex(/^(\d{22})?$/,"El CBU o CVU debe tener 22 números, sin espacios"),
    holder: z.string().trim().max(100, "El titular no puede superar los 100 caracteres"),
    bankName: z.string().trim().max(60, "El banco no puede superar los 60 caracteres")
  })
});

export default function ConfiguracionAdmin() {
  const setGlobalConfig = useSiteConfigStore((s) => s.setConfig);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    api.get("/site-config").then(({ data }) => {
      setConfig(data);
      reset({
        brandName: data.brandName,
        instagram: data.instagram,
        whatsappNumber: data.whatsappNumber,
        whatsappMessage: data.whatsappMessage,
        minPurchaseAmount: data.minPurchaseAmount,
        defaultShippingCost: data.defaultShippingCost,
        freeShippingFrom: data.freeShippingFrom,
        deliveryEtaHours: data.deliveryEtaHours,
        deliveryEtaMaxHours: data.deliveryEtaMaxHours,
        bankTransfer: {
          alias: data.bankTransfer?.alias || "",
          cbu: data.bankTransfer?.cbu || "",
          holder: data.bankTransfer?.holder || "",
          bankName: data.bankTransfer?.bankName || ""
        }
      });
      setLoading(false);
    });
  }, [reset]);

  async function onSubmit(values) {
    const confirmed = await confirmAction({
      title: "¿Guardar los cambios?",
      text: "Los cambios se van a ver en la tienda apenas los guardes.",
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;
    setMessage("");
    setError("");
    try {
      const { data } = await api.put("/site-config", values);
      setConfig(data);
      setGlobalConfig(data);
      setMessage("Configuración actualizada correctamente.");
      toastSuccess("Configuración actualizada");
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toastError(msg);
    }
  }

  function onInvalid() {
    toastError("Completá los campos obligatorios antes de guardar");
  }

  async function uploadLogo() {
    if (!logoFile) return;
    const confirmed = await confirmAction({
      title: "¿Cambiar el logo?",
      text: "El logo nuevo reemplaza al actual en toda la tienda.",
      confirmText: "Sí, cambiar",
      icon: "question"
    });
    if (!confirmed) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);
      const { data } = await api.put("/site-config/logo", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setConfig(data);
      setGlobalConfig(data);
      setLogoFile(null);
      toastSuccess("Logo actualizado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos subir el logo"));
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-900">Configuración</h1>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Logo de la marca</p>
        <div className="flex flex-wrap items-center gap-4">
          {config?.logo?.url && <img src={config.logo.url} alt="Logo" className="h-14 w-auto rounded-lg border border-ink-100 p-1" />}
          <FileInput onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          <Button type="button" size="sm" variant="outline" onClick={uploadLogo} disabled={!logoFile || uploadingLogo}>
            {uploadingLogo ? (
              <>
                <Spinner className="h-4 w-4" /> Subiendo...
              </>
            ) : (
              "Subir logo"
            )}
          </Button>
        </div>
      </div>

      <ThemeColorsSection config={config} onSaved={setConfig} />

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
        <Input label="Nombre de la marca" {...register("brandName")} error={errors.brandName?.message} />
        <Input label="Link de Instagram" {...register("instagram")} error={errors.instagram?.message} />
        <Input label="Número de WhatsApp (sin 0 ni 15, ej: 3814091213)" {...register("whatsappNumber")} error={errors.whatsappNumber?.message} />
        <Textarea label="Mensaje predefinido de WhatsApp" rows={2} {...register("whatsappMessage")} error={errors.whatsappMessage?.message} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Monto mínimo de compra ($)" type="number" {...register("minPurchaseAmount")} error={errors.minPurchaseAmount?.message} />
          <Input label="Costo de envío por defecto ($)" type="number" {...register("defaultShippingCost")} error={errors.defaultShippingCost?.message} />
          <Input label="Envío gratis desde ($, 0 = deshabilitado)" type="number" {...register("freeShippingFrom")} error={errors.freeShippingFrom?.message} />
          <Input label="Entrega desde (horas)" type="number" {...register("deliveryEtaHours")} error={errors.deliveryEtaHours?.message} />
          <Input label="Entrega hasta (horas)" type="number" {...register("deliveryEtaMaxHours")} error={errors.deliveryEtaMaxHours?.message} />
        </div>

        <div className="border-t border-ink-100 pt-4">
          <p className="text-sm font-semibold text-ink-900">Datos para pagos por transferencia</p>
          <p className="mt-1 text-xs text-ink-500">
            Son los datos que ve el cliente cuando elige pagar por transferencia. Si dejás vacíos el alias y el CBU, la opción de
            transferencia no aparece en la tienda.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input label="Alias" placeholder="dulcinard.golosinas" {...register("bankTransfer.alias")} error={errors.bankTransfer?.alias?.message} />
            <Input label="CBU o CVU (22 números)" inputMode="numeric" {...register("bankTransfer.cbu")} error={errors.bankTransfer?.cbu?.message} />
            <Input label="Titular de la cuenta" {...register("bankTransfer.holder")} error={errors.bankTransfer?.holder?.message} />
            <Input label="Banco o billetera (opcional)" {...register("bankTransfer.bankName")} error={errors.bankTransfer?.bankName?.message} />
          </div>
        </div>

        {message && <p className="text-sm text-brand-600">{message}</p>}
        {error && <p className="text-sm text-danger-600">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          Guardar configuración
        </Button>
      </form>
    </div>
  );
}
