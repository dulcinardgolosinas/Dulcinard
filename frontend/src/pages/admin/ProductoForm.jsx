import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Spinner, PageLoader } from "../../components/ui/Spinner";
import { UNIT_LABELS } from "../../lib/format";

const UNITS = Object.keys(UNIT_LABELS);

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
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      category: "",
      sku: "",
      price: "",
      unit: "unidad",
      unitsPerPack: 1,
      stock: 0,
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
        sku: data.sku || "",
        price: data.price,
        unit: data.unit,
        unitsPerPack: data.unitsPerPack,
        stock: data.stock,
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
      navigate("/admin/productos");
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos guardar el producto"));
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900">{isEdit ? "Editar producto" : "Nuevo producto"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Nombre del producto" {...register("name", { required: "El nombre es obligatorio" })} error={errors.name?.message} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Descripción" rows={3} {...register("description")} />
          </div>
          <Input label="Marca" {...register("brand")} />
          <Select label="Categoría" {...register("category", { required: "Elegí una categoría" })} error={errors.category?.message}>
            <option value="">Seleccionar...</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="SKU (opcional)" {...register("sku")} />
        </div>

        <div className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 sm:grid-cols-3">
          <Input
            label="Precio mayorista ($)"
            type="number"
            step="0.01"
            {...register("price", { required: "Ingresá un precio", min: 0 })}
            error={errors.price?.message}
          />
          <Select label="Unidad de venta" {...register("unit")}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u]}
              </option>
            ))}
          </Select>
          <Input label="Unidades por pack" type="number" {...register("unitsPerPack", { min: 1 })} />
          <Input label="Stock disponible" type="number" {...register("stock", { required: true, min: 0 })} />
          <Input label="Pedido mínimo" type="number" {...register("minOrderQty", { min: 1 })} />
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
          <p className="mb-3 text-sm font-semibold text-ink-900">Imágenes (Cloudinary)</p>

          {existingImages.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.publicId} className="relative h-20 w-20">
                  <img
                    src={img.url}
                    alt=""
                    className={`h-full w-full rounded-xl object-cover ${imagesToRemove.includes(img.publicId) ? "opacity-30" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleRemoveImage(img.publicId)}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow"
                  >
                    {imagesToRemove.includes(img.publicId) ? "↺" : "✕"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
          {newFiles.length > 0 && <p className="mt-2 text-xs text-ink-400">{newFiles.length} imagen(es) nueva(s) para subir</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
