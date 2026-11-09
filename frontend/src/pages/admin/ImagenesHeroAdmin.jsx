import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../lib/api";
import { FileInput } from "../../components/ui/FileInput";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { usePageHeroStore } from "../../store/pageHeroStore";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { Film } from "lucide-react";
import { MAX_PHOTO_BYTES, checkHeroFile, formatMB, isVideoFile, uploadHeroMedia } from "../../lib/heroMedia";

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

/** Vista previa de un slide: la foto, o el video sin sonido con su miniatura. */
function SlidePreview({ slide }) {
  if (slide.mediaType === "video" && slide.video?.url) {
    return (
      <>
        <video src={slide.video.url} poster={slide.image?.url} muted loop playsInline autoPlay className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink-900/80 px-2 py-0.5 text-xs font-semibold text-white">
          <Film className="h-3.5 w-3.5" /> Video{slide.video.duration ? ` · ${slide.video.duration} s` : ""}
        </span>
      </>
    );
  }
  return <img src={slide.image.url} alt="" className="h-full w-full object-cover" />;
}

/** Barra de progreso mientras se sube un archivo. */
function UploadProgress({ value }) {
  if (value == null) return null;
  return (
    <div className="w-full">
      <div className="h-2 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-500">{value < 100 ? `Subiendo... ${value}%` : "Procesando..."}</p>
    </div>
  );
}

// Cada slide del carrusel: su foto o video, adónde lleva al tocarlo, y las
// opciones de reemplazar, mover, ocultar y eliminar.
function HomeHeroSlideCard({ slide, position, total, products, categories, onChanged, onDeleted, onMove }) {
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [form, setForm] = useState(() => ({
    linkType: slide.linkType || "catalog",
    productName: slide.product?.name || "",
    category: slide.category?._id || ""
  }));
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const listId = `productos-${slide._id}`;
  const what = slide.mediaType === "video" ? "este video" : "esta foto";

  async function handleSaveLink() {
    const product = products.find((p) => p.name.toLowerCase() === form.productName.trim().toLowerCase());
    if (form.linkType === "product" && !product) return toastError("Elegí un producto de la lista");
    if (form.linkType === "category" && !form.category) return toastError("Elegí una categoría");

    const confirmed = await confirmAction({
      title: "¿Guardar a dónde lleva?",
      text: `Al tocar ${what} en la página principal, va a llevar a: ${LINK_LABELS[form.linkType].toLowerCase()}.`,
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const { data } = await api.put(`/home-hero-images/${slide._id}`, {
        linkType: form.linkType,
        product: form.linkType === "product" ? product._id : undefined,
        category: form.linkType === "category" ? form.category : undefined
      });
      onChanged(data);
      toastSuccess("Cambios guardados");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar los cambios"));
    } finally {
      setSaving(false);
    }
  }

  async function handleReplace(e) {
    const file = e.target.files?.[0];
    setFileKey((k) => k + 1);
    if (!file) return;
    const problem = checkHeroFile(file);
    if (problem) return toastError(problem);
    const confirmed = await confirmAction({
      title: `¿Reemplazar ${what}?`,
      text: `Se cambia por ${isVideoFile(file) ? "el video" : "la foto"} que elegiste (${formatMB(file.size)}). Lo anterior se borra.`,
      confirmText: "Sí, reemplazar",
      icon: "question"
    });
    if (!confirmed) return;
    setProgress(0);
    try {
      const data = await uploadHeroMedia(file, { slideId: slide._id, onProgress: setProgress });
      onChanged(data);
      toastSuccess("Reemplazado");
    } catch (err) {
      toastError(err.response ? apiErrorMessage(err, "No pudimos reemplazarlo") : err.message);
    } finally {
      setProgress(null);
    }
  }

  async function toggleActive() {
    const confirmed = await confirmAction({
      title: slide.active ? `¿Ocultar ${what}?` : `¿Mostrar ${what}?`,
      text: slide.active ? "Deja de verse en el carrusel, pero no se borra." : "Vuelve a verse en el carrusel.",
      confirmText: slide.active ? "Sí, ocultar" : "Sí, mostrar",
      icon: "question"
    });
    if (!confirmed) return;
    try {
      const { data } = await api.put(`/home-hero-images/${slide._id}`, { active: !slide.active });
      onChanged(data);
      toastSuccess(data.active ? "Se muestra en el carrusel" : "Oculto");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiarlo"));
    }
  }

  async function handleDelete() {
    const confirmed = await confirmDelete(`${what} del carrusel de la página principal`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/home-hero-images/${slide._id}`);
      toastSuccess("Eliminado del carrusel");
      onDeleted(slide._id);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminarlo"));
    } finally {
      setDeleting(false);
    }
  }

  const fieldClass = "w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border bg-white p-3 ${slide.active ? "border-ink-100" : "border-dashed border-ink-300 opacity-75"}`}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-950">
        <SlidePreview slide={slide} />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-ink-800">
          {position} de {total}
        </span>
        {!slide.active && (
          <span className="absolute right-2 top-2 rounded-full bg-ink-900/80 px-2 py-0.5 text-xs font-semibold text-white">Oculto</span>
        )}
      </div>

      {progress != null ? (
        <UploadProgress value={progress} />
      ) : (
        <FileInput key={fileKey} accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" buttonLabel="Reemplazar foto o video" onChange={handleReplace} />
      )}

      <label className="block text-xs font-medium text-ink-600">
        Al tocarlo, lleva a
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

      <Button type="button" size="sm" onClick={handleSaveLink} disabled={saving}>
        {saving ? <Spinner className="h-4 w-4" /> : "Guardar a dónde lleva"}
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
          {slide.active ? "Ocultar" : "Mostrar"}
        </button>
        <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50">
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

// Tiempo máximo que se muestra cada video antes de pasar al siguiente slide.
function VideoMaxSeconds() {
  const setGlobalConfig = useSiteConfigStore((st) => st.setConfig);
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/site-config").then(({ data }) => {
      setValue(String(data.heroVideoMaxSeconds || 20));
      setSaved(String(data.heroVideoMaxSeconds || 20));
    });
  }, []);

  async function save() {
    const seconds = Number(value);
    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 120) return toastError("Poné un número de segundos entre 5 y 120");
    const confirmed = await confirmAction({
      title: "¿Guardar el tiempo máximo?",
      text: `Cada video se va a mostrar hasta ${seconds} segundos (o menos, si termina antes).`,
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const { data } = await api.put("/site-config", { heroVideoMaxSeconds: seconds });
      setSaved(String(data.heroVideoMaxSeconds));
      setGlobalConfig(data);
      toastSuccess("Tiempo máximo guardado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar el tiempo"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block text-xs font-medium text-ink-600">
        Tiempo máximo de cada video (segundos)
        <input
          type="number"
          min="5"
          max="120"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 block w-28 rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>
      <Button type="button" size="sm" variant="outline" onClick={save} disabled={saving || value === saved}>
        {saving ? <Spinner className="h-4 w-4" /> : "Guardar"}
      </Button>
      <p className="w-full text-xs text-ink-500">Si el video es más corto, pasa al siguiente apenas termina.</p>
    </div>
  );
}

function HomeHeroGallery() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/home-hero-images", { params: { all: "true" } }),
      api.get("/products/images/options"),
      api.get("/categories", { params: { all: "true" } })
    ])
      .then(([slidesRes, productsRes, categoriesRes]) => {
        setSlides(slidesRes.data);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      })
      .catch((err) => toastError(apiErrorMessage(err, "No pudimos cargar el carrusel")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function handleChanged(updated) {
    setSlides((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  }

  // Cambia el orden intercambiando la posición con el slide de al lado.
  async function handleMove(index, step) {
    const other = slides[index + step];
    if (!other) return;
    const confirmed = await confirmAction({
      title: "¿Cambiar el orden?",
      text: `El slide ${index + 1} pasa a ser el ${index + step + 1}.`,
      confirmText: "Sí, mover",
      icon: "question"
    });
    if (!confirmed) return;
    const reordered = [...slides];
    [reordered[index], reordered[index + step]] = [reordered[index + step], reordered[index]];
    try {
      await Promise.all(reordered.map((s, i) => (s.order === i ? null : api.put(`/home-hero-images/${s._id}`, { order: i }))));
      setSlides(reordered.map((s, i) => ({ ...s, order: i })));
      toastSuccess("Orden actualizado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiar el orden"));
    }
  }

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    if (f) {
      const problem = checkHeroFile(f);
      if (problem) {
        setFileKey((k) => k + 1);
        return toastError(problem);
      }
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setFileKey((k) => k + 1);
  }

  async function handleAdd() {
    if (!file) return;
    const confirmed = await confirmAction({
      title: isVideoFile(file) ? "¿Agregar este video?" : "¿Agregar esta foto?",
      text: `Se suma al final del carrusel de la página principal (${formatMB(file.size)}).`,
      confirmText: "Sí, agregar",
      icon: "question"
    });
    if (!confirmed) return;

    setProgress(0);
    try {
      const data = await uploadHeroMedia(file, { onProgress: setProgress });
      toastSuccess(isVideoFile(file) ? "Video agregado al carrusel" : "Foto agregada al carrusel");
      setSlides((prev) => [...prev, data]);
      clearFile();
    } catch (err) {
      toastError(err.response ? apiErrorMessage(err, "No pudimos subirlo") : err.message);
    } finally {
      setProgress(null);
    }
  }

  function handleDeleted(id) {
    setSlides((prev) => prev.filter((s) => s._id !== id));
  }

  if (loading) return <PageLoader />;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4">
      <p className="font-semibold text-ink-900">Carrusel de la página principal</p>
      <p className="mt-1 text-xs text-ink-500">
        Las fotos y videos que van pasando arriba de todo en la página principal, sin texto encima. En cada uno podés elegir
        adónde lleva al tocarlo. Si no cargás ninguno, se muestra el video de siempre.
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-ink-500">
        <li>Fotos: JPG, PNG o WEBP, horizontales y de 1600 px de ancho o más. Hasta {formatMB(MAX_PHOTO_BYTES)}.</li>
        <li>Videos: MP4, WEBM o MOV, horizontales y cortos. Hasta 40 MB. Se ven sin sonido.</li>
      </ul>

      <div className="mt-4 rounded-xl bg-ink-50 p-3">
        <VideoMaxSeconds />
      </div>

      {slides.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, i) => (
            <HomeHeroSlideCard
              key={s._id}
              slide={s}
              position={i + 1}
              total={slides.length}
              products={products}
              categories={categories}
              onChanged={handleChanged}
              onDeleted={handleDeleted}
              onMove={(step) => handleMove(i, step)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-ink-50 pt-4">
        <p className="mb-2 text-sm font-semibold text-ink-900">Agregar una foto o un video</p>
        <div className="flex flex-wrap items-center gap-3">
          {preview && (
            <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-ink-950">
              {isVideoFile(file) ? (
                <video src={preview} muted playsInline autoPlay loop className="h-full w-full object-cover" />
              ) : (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          )}
          {progress == null && (
            <FileInput key={fileKey} accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" buttonLabel="Elegir foto o video" onChange={handleFile} />
          )}
          {file && progress == null && (
            <>
              <span className="text-xs text-ink-500">{formatMB(file.size)}</span>
              <Button type="button" size="sm" onClick={handleAdd}>
                Agregar al carrusel
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearFile}>
                Cancelar
              </Button>
            </>
          )}
          {progress != null && <UploadProgress value={progress} />}
        </div>
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
