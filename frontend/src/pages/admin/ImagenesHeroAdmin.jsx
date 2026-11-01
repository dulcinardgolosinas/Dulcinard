import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../lib/api";
import { FileInput } from "../../components/ui/FileInput";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { usePageHeroStore } from "../../store/pageHeroStore";

const PAGE_LABELS = {
  "quienes-somos": "Quiénes somos",
  envios: "Envíos y zonas",
  contacto: "Contacto"
};

function HeroCard({ hero, onChanged }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const label = PAGE_LABELS[hero.page] || hero.page;

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function upload() {
    if (!file) return;
    const confirmed = await confirmAction({
      title: hero.backgroundImage?.url ? "¿Reemplazar imagen?" : "¿Subir imagen?",
      text: `Vas a cambiar la foto de arriba de la página "${label}".`,
      confirmText: "Sí, subir",
      icon: "question"
    });
    if (!confirmed) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.put(`/page-heroes/${hero.page}/image`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toastSuccess(`Fondo de "${label}" actualizado`);
      setFile(null);
      setPreview(null);
      onChanged(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos subir la imagen"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    const confirmed = await confirmDelete(`la imagen de fondo de "${label}"`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { data } = await api.delete(`/page-heroes/${hero.page}/image`);
      toastSuccess(`Se sacó la imagen de "${label}", ahora usa el fondo por defecto`);
      onChanged(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar la imagen"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4">
      <p className="font-semibold text-ink-900">{label}</p>

      <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink-200 bg-ink-950">
        {preview || hero.backgroundImage?.url ? (
          <img src={preview || hero.backgroundImage.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-white/50">Sin imagen — se usa el fondo por defecto</span>
        )}
      </div>

      <FileInput onChange={handleFile} />

      <div className="flex gap-2">
        {file && (
          <Button type="button" size="sm" variant="outline" onClick={upload} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner className="h-4 w-4" /> Subiendo...
              </>
            ) : (
              "Subir imagen"
            )}
          </Button>
        )}
        {hero.backgroundImage?.url && !file && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-semibold text-danger-600 hover:underline disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar imagen"}
          </button>
        )}
      </div>
    </div>
  );
}

const LINK_LABELS = { catalog: "Todos los productos", product: "Un producto", category: "Una categoría" };

// Cada foto del carrusel: texto opcional, texto del botón y adónde lleva "Comprar".
function HomeHeroImageCard({ image, position, total, products, categories, onChanged, onDeleted, onMove }) {
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    title: image.title || "",
    buttonText: image.buttonText || "Comprar",
    linkType: image.linkType || "catalog",
    productName: image.product?.name || "",
    category: image.category?._id || ""
  }));
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const listId = `productos-${image._id}`;

  async function handleSave() {
    if (form.title.length > 80) return toastError("El texto sobre la foto puede tener hasta 80 caracteres");
    if (form.buttonText.trim().length > 24) return toastError("El texto del botón puede tener hasta 24 caracteres");
    const product = products.find((p) => p.name.toLowerCase() === form.productName.trim().toLowerCase());
    if (form.linkType === "product" && !product) return toastError("Elegí un producto de la lista");
    if (form.linkType === "category" && !form.category) return toastError("Elegí una categoría");

    const confirmed = await confirmAction({
      title: "¿Guardar los cambios de esta foto?",
      text: "Se ven en la página principal apenas los guardes.",
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const { data } = await api.put(`/home-hero-images/${image._id}`, {
        title: form.title.trim(),
        buttonText: form.buttonText.trim() || "Comprar",
        linkType: form.linkType,
        product: form.linkType === "product" ? product._id : undefined,
        category: form.linkType === "category" ? form.category : undefined
      });
      onChanged(data);
      toastSuccess("Foto actualizada");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar los cambios"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    const confirmed = await confirmAction({
      title: image.active ? "¿Ocultar esta foto?" : "¿Mostrar esta foto?",
      text: image.active ? "Deja de verse en el carrusel, pero no se borra." : "Vuelve a verse en el carrusel.",
      confirmText: image.active ? "Sí, ocultar" : "Sí, mostrar",
      icon: "question"
    });
    if (!confirmed) return;
    try {
      const { data } = await api.put(`/home-hero-images/${image._id}`, { active: !image.active });
      onChanged(data);
      toastSuccess(data.active ? "La foto se muestra en el carrusel" : "Foto oculta");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiar la foto"));
    }
  }

  async function handleDelete() {
    const confirmed = await confirmDelete("esta foto del carrusel de la página principal");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/home-hero-images/${image._id}`);
      toastSuccess("Foto eliminada del carrusel de la página principal");
      onDeleted(image._id);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar la foto"));
    } finally {
      setDeleting(false);
    }
  }

  const fieldClass = "w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border bg-white p-3 ${image.active ? "border-ink-100" : "border-dashed border-ink-300 opacity-75"}`}>
      <div className="relative h-32 overflow-hidden rounded-xl bg-ink-950">
        <img src={image.image.url} alt="" className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-ink-800">
          {position} de {total}
        </span>
        {!image.active && (
          <span className="absolute right-2 top-2 rounded-full bg-ink-900/80 px-2 py-0.5 text-xs font-semibold text-white">Oculta</span>
        )}
      </div>

      <label className="block text-xs font-medium text-ink-600">
        Texto sobre la foto (opcional)
        <input value={form.title} onChange={set("title")} maxLength={80} placeholder="Ej: Nuevos alfajores Tofi" className={`mt-1 ${fieldClass}`} />
      </label>
      <label className="block text-xs font-medium text-ink-600">
        Texto del botón
        <input value={form.buttonText} onChange={set("buttonText")} maxLength={24} className={`mt-1 ${fieldClass}`} />
      </label>
      <label className="block text-xs font-medium text-ink-600">
        El botón lleva a
        <select value={form.linkType} onChange={set("linkType")} className={`mt-1 ${fieldClass}`}>
          {Object.entries(LINK_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {form.linkType === "product" && (
        <label className="block text-xs font-medium text-ink-600">
          Producto (escribí para buscar)
          <input list={listId} value={form.productName} onChange={set("productName")} className={`mt-1 ${fieldClass}`} />
          <datalist id={listId}>
            {products.map((p) => (
              <option key={p._id} value={p.name} />
            ))}
          </datalist>
        </label>
      )}
      {form.linkType === "category" && (
        <label className="block text-xs font-medium text-ink-600">
          Categoría
          <select value={form.category} onChange={set("category")} className={`mt-1 ${fieldClass}`}>
            <option value="">Elegí una categoría</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
        {saving ? <Spinner className="h-4 w-4" /> : "Guardar cambios"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-50 pt-2 text-sm">
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={position === 1} className="rounded-lg border border-ink-200 px-2 py-1 text-xs font-semibold text-ink-700 disabled:opacity-40" aria-label="Mover antes">
            ← Antes
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={position === total} className="rounded-lg border border-ink-200 px-2 py-1 text-xs font-semibold text-ink-700 disabled:opacity-40" aria-label="Mover después">
            Después →
          </button>
        </div>
        <button type="button" onClick={toggleActive} className="text-xs font-semibold text-brand-600 hover:underline">
          {image.active ? "Ocultar" : "Mostrar"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-danger-600 hover:underline disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

function HomeHeroGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/home-hero-images", { params: { all: "true" } }),
      api.get("/products/images/options"),
      api.get("/categories", { params: { all: "true" } })
    ])
      .then(([imagesRes, productsRes, categoriesRes]) => {
        setImages(imagesRes.data);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      })
      .catch((err) => toastError(apiErrorMessage(err, "No pudimos cargar las fotos")))
      .finally(() => setLoading(false));
  }, []);

  function handleChanged(updated) {
    setImages((prev) => prev.map((img) => (img._id === updated._id ? updated : img)));
  }

  // Cambia el orden intercambiando la posición con la foto de al lado.
  async function handleMove(index, step) {
    const other = images[index + step];
    if (!other) return;
    const confirmed = await confirmAction({
      title: "¿Cambiar el orden?",
      text: `La foto ${index + 1} pasa a ser la ${index + step + 1}.`,
      confirmText: "Sí, mover",
      icon: "question"
    });
    if (!confirmed) return;
    const reordered = [...images];
    [reordered[index], reordered[index + step]] = [reordered[index + step], reordered[index]];
    try {
      await Promise.all(reordered.map((img, i) => (img.order === i ? null : api.put(`/home-hero-images/${img._id}`, { order: i }))));
      setImages(reordered.map((img, i) => ({ ...img, order: i })));
      toastSuccess("Orden actualizado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiar el orden"));
    }
  }

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleAdd() {
    if (!file) return;
    const confirmed = await confirmAction({
      title: "¿Agregar foto?",
      text: "Se va a sumar al carrusel de fotos de la página principal.",
      confirmText: "Sí, agregar",
      icon: "question"
    });
    if (!confirmed) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/home-hero-images", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toastSuccess("Foto agregada a la página principal");
      setFile(null);
      setPreview(null);
      setImages((prev) => [...prev, data]);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos subir la foto"));
    } finally {
      setUploading(false);
    }
  }

  function handleDeleted(id) {
    setImages((prev) => prev.filter((img) => img._id !== id));
  }

  if (loading) return <PageLoader />;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4">
      <p className="font-semibold text-ink-900">Carrusel de la página principal</p>
      <p className="mt-1 text-xs text-ink-500">
        Las fotos grandes que van pasando arriba de todo en la página principal, con el botón "Comprar". En cada foto podés
        elegir adónde lleva ese botón. Si no cargás ninguna, se muestra el video. Usá fotos horizontales y grandes (de 1600 px de
        ancho o más).
      </p>

      {images.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <HomeHeroImageCard
              key={img._id}
              image={img}
              position={i + 1}
              total={images.length}
              products={products}
              categories={categories}
              onChanged={handleChanged}
              onDeleted={handleDeleted}
              onMove={(step) => handleMove(i, step)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-50 pt-4">
        {preview && <img src={preview} alt="" className="h-16 w-16 rounded-lg object-cover" />}
        <FileInput onChange={handleFile} />
        {file && (
          <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner className="h-4 w-4" /> Subiendo...
              </>
            ) : (
              "Agregar foto"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ImagenesHeroAdmin() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const setStoreImage = usePageHeroStore((s) => s.setImage);

  async function load() {
    const { data } = await api.get("/page-heroes");
    setHeroes(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleChanged(updated) {
    setHeroes((prev) => prev.map((h) => (h.page === updated.page ? updated : h)));
    setStoreImage(updated.page, updated.backgroundImage?.url || null);
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Página principal</h1>
      <p className="mt-1 text-sm text-ink-500">
        Las fotos grandes que se ven arriba de todo en la tienda. Más abajo podés cambiar la foto de arriba de las otras páginas; si
        no cargás una, se usa un fondo con los colores de la marca.
      </p>

      <div className="mt-6">
        <HomeHeroGallery />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {heroes.map((h) => (
          <HeroCard key={h.page} hero={h} onChanged={handleChanged} />
        ))}
      </div>
    </div>
  );
}
