import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { futureDateField, numberField } from "../../lib/validators";

function toInputDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "El título es obligatorio")
      .min(2, "El título debe tener al menos 2 caracteres")
      .max(120, "El título no puede superar los 120 caracteres"),
    description: z.string().trim().max(500, "La descripción no puede superar los 500 caracteres").optional(),
    discountPercent: numberField("El descuento", { min: 0, max: 100 }),
    categories: z.array(z.string()).optional(),
    startDate: futureDateField("La fecha de inicio"),
    endDate: futureDateField("La fecha de fin"),
    active: z.boolean().optional()
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["endDate"]
  });

function PromotionForm({ editing, categories, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editing?.title || "",
      description: editing?.description || "",
      discountPercent: editing?.discountPercent || 0,
      categories: editing?.categories?.map((c) => c._id || c) || [],
      startDate: toInputDate(editing?.startDate) || toInputDate(new Date()),
      endDate: toInputDate(editing?.endDate),
      active: editing?.active ?? true
    }
  });

  useEffect(() => {
    reset({
      title: editing?.title || "",
      description: editing?.description || "",
      discountPercent: editing?.discountPercent || 0,
      categories: editing?.categories?.map((c) => c._id || c) || [],
      startDate: toInputDate(editing?.startDate) || toInputDate(new Date()),
      endDate: toInputDate(editing?.endDate),
      active: editing?.active ?? true
    });
    setFile(null);
  }, [editing, reset]);

  async function onSubmit(values) {
    if (editing) {
      const confirmed = await confirmAction({
        title: "¿Guardar cambios?",
        text: "Vas a actualizar esta promoción.",
        confirmText: "Sí, guardar",
        icon: "question"
      });
      if (!confirmed) return;
    }

    setError("");
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("discountPercent", values.discountPercent);
    formData.append("startDate", values.startDate);
    formData.append("endDate", values.endDate);
    formData.append("active", values.active);
    formData.append("categories", JSON.stringify(values.categories || []));
    formData.append("products", JSON.stringify([]));
    if (file) formData.append("banner", file);

    try {
      if (editing) {
        await api.put(`/promotions/${editing._id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/promotions", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toastSuccess(editing ? "Promoción actualizada" : "Promoción creada");
      onSaved();
    } catch (err) {
      const message = apiErrorMessage(err, "No pudimos guardar la promoción");
      setError(message);
      toastError(message);
    }
  }

  function onInvalid() {
    toastError("Completá los campos obligatorios antes de guardar");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="font-semibold text-ink-900">{editing ? `Editando: ${editing.title}` : "Nueva promoción"}</p>
      <Input label="Título" {...register("title")} error={errors.title?.message} />
      <Textarea label="Descripción" rows={2} {...register("description")} error={errors.description?.message} />
      <Input label="Descuento (%)" type="number" min="0" max="100" {...register("discountPercent")} error={errors.discountPercent?.message} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Desde"
          type="date"
          min={toInputDate(new Date())}
          {...register("startDate")}
          error={errors.startDate?.message}
        />
        <Input
          label="Hasta"
          type="date"
          min={toInputDate(new Date())}
          {...register("endDate")}
          error={errors.endDate?.message}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-700">Categorías incluidas</p>
        <p className="mb-2 text-xs text-ink-500">
          El descuento se aplica al precio de todos los productos de estas categorías. Sin categorías, la promo es solo
          informativa (banner) y no descuenta.
        </p>
        <Controller
          control={control}
          name="categories"
          render={({ field }) => (
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {categories.map((c) => {
                const checked = field.value?.includes(c._id);
                return (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() =>
                      field.onChange(checked ? field.value.filter((id) => id !== c._id) : [...(field.value || []), c._id])
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      checked ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
        Activa
      </label>

      <div>
        {editing?.banner?.url && !file && <img src={editing.banner.url} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />}
        <FileInput label="Banner" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : editing ? "Guardar cambios" : "Crear promoción"}
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

export default function PromocionesAdmin() {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const [promosRes, catsRes] = await Promise.all([api.get("/promotions"), api.get("/categories", { params: { all: "true" } })]);
    setPromotions(promosRes.data);
    setCategories(catsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(promo) {
    const confirmed = await confirmDelete(`la promoción "${promo.title}"`);
    if (!confirmed) return;
    try {
      await api.delete(`/promotions/${promo._id}`);
      toastSuccess("Promoción eliminada");
      load();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar la promoción"));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Promociones</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {loading ? (
            <PageLoader />
          ) : (
            <div className="space-y-3">
              {promotions.map((p) => (
                <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                      {p.banner?.url && <img src={p.banner.url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{p.title}</p>
                      <p className="text-xs text-ink-400">
                        {new Date(p.startDate).toLocaleDateString("es-AR")} - {new Date(p.endDate).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={p.isCurrentlyActive ? "success" : "neutral"}>{p.isCurrentlyActive ? "Vigente" : "Inactiva"}</Badge>
                    <button onClick={() => setEditing(p)} className="text-sm font-semibold text-brand-600 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-sm font-semibold text-danger-600 hover:underline">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {promotions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center text-ink-400">
                  Todavía no cargaste promociones.
                </div>
              )}
            </div>
          )}
        </div>

        <PromotionForm
          editing={editing}
          categories={categories}
          onSaved={() => { setEditing(null); load(); }}
          onCancel={() => setEditing(null)}
        />
      </div>
    </div>
  );
}
