import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../../lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { formatCurrency } from "../../lib/format";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { nameField, numberField } from "../../lib/validators";

const schema = z.object({
  name: nameField("El nombre de la zona", { min: 2, max: 80 }),
  cost: numberField("El costo de envío", { min: 0, max: 1000000 }),
  minPurchaseAmount: numberField("El monto mínimo de compra", { min: 0, max: 100000000 }),
  freeShippingFrom: numberField("El monto de envío gratis", { min: 0, max: 100000000 }),
  active: z.boolean().optional()
});

function ZoneForm({ editing, onSaved, onCancel }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editing?.name || "",
      cost: editing?.cost ?? 80,
      minPurchaseAmount: editing?.minPurchaseAmount ?? 500,
      freeShippingFrom: editing?.freeShippingFrom ?? 0,
      active: editing?.active ?? true
    }
  });

  useEffect(() => {
    reset({
      name: editing?.name || "",
      cost: editing?.cost ?? 80,
      minPurchaseAmount: editing?.minPurchaseAmount ?? 500,
      freeShippingFrom: editing?.freeShippingFrom ?? 0,
      active: editing?.active ?? true
    });
  }, [editing, reset]);

  async function onSubmit(values) {
    if (editing) {
      const confirmed = await confirmAction({
        title: "¿Guardar cambios?",
        text: "Vas a actualizar esta zona de envío.",
        confirmText: "Sí, guardar",
        icon: "question"
      });
      if (!confirmed) return;
    }

    setError("");
    try {
      if (editing) await api.put(`/shipping-zones/${editing._id}`, values);
      else await api.post("/shipping-zones", values);
      toastSuccess(editing ? "Zona actualizada" : "Zona creada");
      onSaved();
    } catch (err) {
      const message = apiErrorMessage(err, "No pudimos guardar la zona");
      setError(message);
      toastError(message);
    }
  }

  function onInvalid() {
    toastError("Completá los campos obligatorios antes de guardar");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="font-semibold text-ink-900">{editing ? `Editando: ${editing.name}` : "Nueva zona de envío"}</p>
      <Input label="Nombre de la zona" placeholder="Ej: Yerba Buena" {...register("name")} error={errors.name?.message} />
      <Input label="Costo de envío ($)" type="number" {...register("cost")} error={errors.cost?.message} />
      <Input label="Monto mínimo de compra ($)" type="number" {...register("minPurchaseAmount")} error={errors.minPurchaseAmount?.message} />
      <Input label="Envío gratis desde ($, 0 = deshabilitado)" type="number" {...register("freeShippingFrom")} error={errors.freeShippingFrom?.message} />
      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
        Zona activa
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : editing ? "Guardar cambios" : "Crear zona"}
        </Button>
        {editing && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

export default function ZonasEnvioAdmin() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/shipping-zones", { params: { all: "true" } });
    setZones(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(zone) {
    const confirmed = await confirmDelete(`la zona "${zone.name}"`);
    if (!confirmed) return;
    try {
      await api.delete(`/shipping-zones/${zone._id}`);
      toastSuccess("Zona eliminada");
      load();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar la zona"));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Zonas de envío</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {loading ? (
            <PageLoader />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
                  <tr>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3">Mínimo</th>
                    <th className="px-4 py-3">Envío</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z._id} className="border-t border-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-900">{z.name}</td>
                      <td className="px-4 py-3 text-ink-600">{formatCurrency(z.minPurchaseAmount)}</td>
                      <td className="px-4 py-3 text-ink-600">{formatCurrency(z.cost)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={z.active ? "success" : "neutral"}>{z.active ? "Activa" : "Inactiva"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditing(z)} className="mr-3 text-sm font-semibold text-brand-600 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(z)} className="text-sm font-semibold text-red-600 hover:underline">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {zones.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-ink-400">
                        Todavía no cargaste zonas de envío.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ZoneForm editing={editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
      </div>
    </div>
  );
}
