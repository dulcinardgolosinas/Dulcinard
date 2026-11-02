import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { futureDateField, numberField } from "../../lib/validators";
import { formatCurrency } from "../../lib/format";
import { useSiteConfigStore } from "../../store/siteConfigStore";

// Día en hora de Argentina (aaaa-mm-dd), para los campos de fecha.
function toInputDate(d) {
  return d ? new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }) : "";
}
const showDay = (d) => new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

const optionalPrice = (label) =>
  z
    .union([z.literal(""), z.coerce.number({ message: `${label} tiene que ser un número` }).positive(`${label} tiene que ser mayor a 0`).max(100000000)])
    .optional();

const makeSchema = (editing) =>
  z
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
    products: z.array(z.string()).optional(),
    startDate: editing ? z.string().min(1, "Elegí la fecha de inicio") : futureDateField("La fecha de inicio"),
    endDate: futureDateField("La fecha de fin"),
    active: z.boolean().optional(),
    price: optionalPrice("El precio de la promo"),
    regularPrice: optionalPrice("El precio normal"),
    showInPopup: z.boolean().optional()
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["endDate"]
  })
  .refine((data) => !data.price || !data.regularPrice || Number(data.regularPrice) > Number(data.price), {
    message: "El precio normal tiene que ser mayor al precio de la promo",
    path: ["regularPrice"]
  });

const formValues = (editing) => ({
  title: editing?.title || "",
  description: editing?.description || "",
  discountPercent: editing?.discountPercent || 0,
  categories: editing?.categories?.map((c) => c._id || c) || [],
  products: editing?.products?.map((p) => p._id || p) || [],
  startDate: toInputDate(editing?.startDate) || toInputDate(new Date()),
  endDate: toInputDate(editing?.endDate),
  active: editing?.active ?? true,
  price: editing?.price ?? "",
  regularPrice: editing?.regularPrice ?? "",
  showInPopup: editing?.showInPopup ?? true
});

function ProductPicker({ options, value, onChange }) {
  const [text, setText] = useState("");
  const selected = value.map((id) => options.find((o) => o._id === id) || { _id: id, name: "Producto" });

  function add(name) {
    const match = options.find((o) => o.name.toLowerCase() === name.trim().toLowerCase());
    if (!match) return;
    if (!value.includes(match._id)) onChange([...value, match._id]);
    setText("");
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-700">Productos de la promoción</p>
      <p className="mb-2 text-xs text-ink-500">
        El botón "Comprar" lleva a estos productos. Si la promo tiene descuento (%), se aplica a estos productos en el carrito.
      </p>
      <input
        list="promo-product-options"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (options.some((o) => o.name === e.target.value)) add(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder="Escribí para buscar un producto..."
        className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
      />
      <datalist id="promo-product-options">
        {options.map((o) => (
          <option key={o._id} value={o.name} />
        ))}
      </datalist>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((p) => (
            <span key={p._id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-xs font-medium text-brand-600">
              {p.name}
              <button
                type="button"
                onClick={() => onChange(value.filter((id) => id !== p._id))}
                aria-label={`Quitar ${p.name}`}
                className="rounded-full p-0.5 hover:bg-brand-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PromotionForm({ editing, categories, productOptions, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(makeSchema(Boolean(editing))),
    defaultValues: formValues(editing)
  });

  useEffect(() => {
    reset(formValues(editing));
    setFile(null);
  }, [editing, reset]);

  async function onSubmit(values) {
    const confirmed = await confirmAction({
      title: editing ? "¿Guardar cambios?" : "¿Crear esta promoción?",
      text: editing ? "Vas a actualizar esta promoción." : "Se publica en la tienda en las fechas que elegiste.",
      confirmText: editing ? "Sí, guardar" : "Sí, crear",
      icon: "question"
    });
    if (!confirmed) return;

    setError("");
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("discountPercent", values.discountPercent);
    formData.append("startDate", values.startDate);
    formData.append("endDate", values.endDate);
    formData.append("active", values.active);
    formData.append("price", values.price ?? "");
    formData.append("regularPrice", values.regularPrice ?? "");
    formData.append("showInPopup", values.showInPopup);
    formData.append("categories", JSON.stringify(values.categories || []));
    formData.append("products", JSON.stringify(values.products || []));
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
      <Textarea label="Descripción" rows={3} placeholder="Qué incluye, condiciones, etc." {...register("description")} error={errors.description?.message} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio de la promo ($)" type="number" min="0" placeholder="Opcional" {...register("price")} error={errors.price?.message} />
        <Input label="Precio normal ($)" type="number" min="0" placeholder="Se muestra tachado" {...register("regularPrice")} error={errors.regularPrice?.message} />
      </div>
      <Input label="Descuento (%)" type="number" min="0" max="100" {...register("discountPercent")} error={errors.discountPercent?.message} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Desde"
          type="date"
          min={editing ? undefined : toInputDate(new Date())}
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
          un aviso con imagen y no descuenta.
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
                      checked ? "border-brand-600 bg-brand-50 text-brand-600" : "border-ink-200 text-ink-600"
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

      <Controller
        control={control}
        name="products"
        render={({ field }) => <ProductPicker options={productOptions} value={field.value || []} onChange={field.onChange} />}
      />

      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
        Publicada
      </label>
      <label className="flex items-start gap-2 text-sm font-medium text-ink-700">
        <input type="checkbox" {...register("showInPopup")} className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-brand-600" />
        <span>
          Mostrar en el cartel al entrar a la tienda
          <span className="block text-xs font-normal text-ink-500">Igual se ve en la sección Promociones de la página principal.</span>
        </span>
      </label>

      <div>
        {editing?.banner?.url && !file && <img src={editing.banner.url} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />}
        <FileInput label="Foto de la promoción" onChange={(e) => setFile(e.target.files?.[0] || null)} />
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

// Prende o apaga el cartel de promociones que se abre al entrar a la tienda.
// Apagarlo no saca las promociones de la página principal.
function PopupSwitch() {
  const setGlobalConfig = useSiteConfigStore((st) => st.setConfig);
  const [enabled, setEnabled] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/site-config")
      .then(({ data }) => setEnabled(data.promoPopupEnabled !== false))
      .catch(() => setEnabled(true));
  }, []);

  async function toggle() {
    const next = !enabled;
    const confirmed = await confirmAction({
      title: next ? "¿Mostrar el cartel de promociones?" : "¿Sacar el cartel de promociones?",
      text: next
        ? "Al entrar a la tienda se va a abrir un cartel con las promociones vigentes."
        : "Ya no se va a abrir el cartel al entrar. Las promociones siguen apareciendo en la página principal.",
      confirmText: next ? "Sí, mostrar" : "Sí, sacar",
      icon: "question"
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const { data } = await api.put("/site-config", { promoPopupEnabled: next });
      setEnabled(data.promoPopupEnabled !== false);
      setGlobalConfig(data);
      toastSuccess(next ? "El cartel de promociones está activado" : "El cartel de promociones está desactivado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiar el cartel"));
    } finally {
      setSaving(false);
    }
  }

  if (enabled === null) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">Cartel al entrar a la tienda</p>
        <p className="text-xs text-ink-500">
          {enabled
            ? "Activado: al entrar se abre un cartel con las promociones vigentes."
            : "Desactivado: las promociones solo se ven en la página principal."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={saving}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-brand-600" : "bg-ink-200"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
        <span className="sr-only">{enabled ? "Desactivar el cartel" : "Activar el cartel"}</span>
      </button>
    </div>
  );
}

export default function PromocionesAdmin() {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const [promosRes, catsRes, productsRes] = await Promise.all([
      api.get("/promotions"),
      api.get("/categories", { params: { all: "true" } }),
      api.get("/products/images/options")
    ]);
    setPromotions(promosRes.data);
    setCategories(catsRes.data);
    setProductOptions(productsRes.data);
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
      <PopupSwitch />

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
                      <p className="text-xs text-ink-500">
                        {showDay(p.startDate)} al {showDay(p.endDate)}
                        {p.price > 0 && <span className="ml-2 font-semibold text-brand-600">{formatCurrency(p.price)}</span>}
                        {p.discountPercent > 0 && <span className="ml-2 font-semibold text-brand-600">{p.discountPercent}% OFF</span>}
                      </p>
                      {p.showInPopup !== false && <p className="text-xs text-ink-400">Sale en el cartel al entrar</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={p.isCurrentlyActive ? "success" : "neutral"}>{p.isCurrentlyActive ? "Vigente" : "No vigente"}</Badge>
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
          productOptions={productOptions}
          onSaved={() => { setEditing(null); load(); }}
          onCancel={() => setEditing(null)}
        />
      </div>
    </div>
  );
}
