import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { Spinner, PageLoader } from "../../components/ui/Spinner";
import { UNIT_LABELS } from "../../lib/format";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { alphanumericField, optionalAlphanumericField, numberField, intField } from "../../lib/validators";

const UNITS = Object.keys(UNIT_LABELS);

const schema = z.object({
  name: alphanumericField("El nombre del producto", { min: 2, max: 150 }),
  description: z.string().trim().max(2000, "La descripción no puede superar los 2000 caracteres").optional(),
  brand: optionalAlphanumericField("La marca", { max: 80 }),
  category: z.string().min(1, "Elegí una categoría"),
  price: numberField("El precio", { min: 0, max: 100000000 }),
  unit: z.enum(UNITS),
  unitsPerPack: intField("Las unidades por pack", { min: 1, max: 100000 }),
  stock: intField("El stock", { min: 0, max: 10000000 }),
  minStock: intField("El stock mínimo", { min: 0, max: 10000000 }),
  minOrderQty: intField("El pedido mínimo", { min: 1, max: 100000 }),
  featured: z.boolean().optional(),
  active: z.boolean().optional()
});

export default function ProductoForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // { url, publicId }
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      category: "",
      price: "",
      unit: "unidad",
      unitsPerPack: 1,
      stock: 0,
      minStock: 0,
      minOrderQty: 1,
      featured: false,
      active: true
    }
  });

  useEffect(() => {
    api.get("/categories", { params: { all: "true" } }).then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`).then(({ data }) => {
      reset({
        name: data.name,
        description: data.description,
        brand: data.brand,
        category: data.category?._id || data.category,
        price: data.price,
        unit: data.unit,
        unitsPerPack: data.unitsPerPack,
        stock: data.stock,
        minStock: data.minStock ?? 0,
        minOrderQty: data.minOrderQty,
        featured: data.featured,
        active: data.active
      });
      setExistingImages(data.images || []);
      setLoading(false);
    });
  }, [id, isEdit, reset]);

  function toggleRemoveImage(publicId) {
    setImagesToRemove((prev) => (prev.includes(publicId) ? prev.filter((p) => p !== publicId) : [...prev, publicId]));
  }

  async function onSubmit(values) {
    if (isEdit) {
      const confirmed = await confirmAction({
        title: "¿Guardar cambios?",
        text: "Vas a actualizar este producto.",
        confirmText: "Sí, guardar",
        icon: "question"
      });
      if (!confirmed) return;
    }

    setError("");
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value));
    if (imagesToRemove.length) formData.append("removeImages", JSON.stringify(imagesToRemove));
    newFiles.forEach((file) => formData.append("images", file));

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toastSuccess(isEdit ? "Producto actualizado" : "Producto creado");
      navigate("/admin/productos");
    } catch (err) {
      const message = apiErrorMessage(err, "No pudimos guardar el producto");
      setError(message);
      toastError(message);
    }
  }

  function onInvalid() {
    toastError("Completá los campos obligatorios antes de guardar");
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900">{isEdit ? "Editar producto" : "Nuevo producto"}</h1>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-6">
        <div className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Nombre del producto" {...register("name")} error={errors.name?.message} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Descripción" rows={3} {...register("description")} error={errors.description?.message} />
          </div>
          <Input label="Marca" {...register("brand")} error={errors.brand?.message} />
          <Select label="Categoría" {...register("category")} error={errors.category?.message}>
            <option value="">Seleccionar...</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 sm:grid-cols-3">
          <Input
            label="Precio mayorista ($)"
            type="number"
            step="0.01"
            {...register("price")}
            error={errors.price?.message}
          />
          <Select label="Unidad de venta" {...register("unit")} error={errors.unit?.message}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u]}
              </option>
            ))}
          </Select>
          <Input label="Unidades por pack" type="number" {...register("unitsPerPack")} error={errors.unitsPerPack?.message} />
          <Input label="Stock disponible" type="number" {...register("stock")} error={errors.stock?.message} />
          <Input
            label="Stock mínimo (alerta de reposición)"
            type="number"
            {...register("minStock")}
            error={errors.minStock?.message}
          />
          <Input label="Pedido mínimo" type="number" {...register("minOrderQty")} error={errors.minOrderQty?.message} />
          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input type="checkbox" {...register("active")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
              Activo
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-ink-900">Imágenes</p>

          {existingImages.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.publicId} className="relative h-20 w-20">
                  <img
                    src={img.url}
                    alt=""
                    className={`h-full w-full rounded-xl border border-ink-100 bg-white object-contain ${imagesToRemove.includes(img.publicId) ? "opacity-30" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleRemoveImage(img.publicId)}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-danger-600 shadow"
                  >
                    {imagesToRemove.includes(img.publicId) ? <RotateCcw className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          <FileInput multiple onChange={(e) => setNewFiles(Array.from(e.target.files || []))} />
          {newFiles.length > 0 && <p className="mt-2 text-xs text-ink-400">{newFiles.length} imagen(es) nueva(s) para subir</p>}
        </div>

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="h-4 w-4" /> : isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/admin/productos")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
