import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";

export default function ConfiguracionAdmin() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    api.get("/site-config").then(({ data }) => {
      setConfig(data);
      reset({
        brandName: data.brandName,
        instagram: data.instagram,
        whatsappNumber: data.whatsappNumber,
        whatsappMessage: data.whatsappMessage,
        pedidosYaUrl: data.pedidosYaUrl,
        minPurchaseAmount: data.minPurchaseAmount,
        defaultShippingCost: data.defaultShippingCost,
        freeShippingFrom: data.freeShippingFrom,
        deliveryEtaHours: data.deliveryEtaHours
      });
      setLoading(false);
    });
  }, [reset]);

  async function onSubmit(values) {
    setMessage("");
    setError("");
    try {
      const { data } = await api.put("/site-config", values);
      setConfig(data);
      setMessage("Configuración actualizada correctamente.");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function uploadLogo() {
    if (!logoFile) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("logo", logoFile);
    const { data } = await api.put("/site-config/logo", formData, { headers: { "Content-Type": "multipart/form-data" } });
    setConfig(data);
    setLogoFile(null);
    setUploadingLogo(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-900">Configuración general</h1>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Logo de la marca (Cloudinary)</p>
        <div className="flex items-center gap-4">
          {config?.logo?.url && <img src={config.logo.url} alt="Logo" className="h-14 w-auto rounded-lg border border-ink-100 p-1" />}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
          <Button type="button" size="sm" variant="outline" onClick={uploadLogo} disabled={!logoFile || uploadingLogo}>
            {uploadingLogo ? <Spinner className="h-4 w-4" /> : "Subir logo"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
        <Input label="Nombre de la marca" {...register("brandName")} />
        <Input label="Instagram (URL)" {...register("instagram")} />
        <Input label="Número de WhatsApp (sin 0 ni 15, ej: 3814091213)" {...register("whatsappNumber")} />
        <Textarea label="Mensaje predefinido de WhatsApp" rows={2} {...register("whatsappMessage")} />
        <Input label="Link de PedidosYa (opcional)" {...register("pedidosYaUrl")} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Monto mínimo de compra ($)" type="number" {...register("minPurchaseAmount")} />
          <Input label="Costo de envío por defecto ($)" type="number" {...register("defaultShippingCost")} />
          <Input label="Envío gratis desde ($, 0 = deshabilitado)" type="number" {...register("freeShippingFrom")} />
          <Input label="Tiempo de entrega (horas)" type="number" {...register("deliveryEtaHours")} />
        </div>

        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          Guardar configuración
        </Button>
      </form>
    </div>
  );
}
