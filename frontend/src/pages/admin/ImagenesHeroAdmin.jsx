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
      text: `Vas a actualizar el fondo del hero de "${label}".`,
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

function HomeHeroImageCard({ image, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = await confirmDelete("esta foto del hero del home");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/home-hero-images/${image._id}`);
      toastSuccess("Foto eliminada del hero del home");
      onDeleted(image._id);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar la foto"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative flex flex-col gap-2 rounded-2xl border border-ink-100 bg-white p-3">
      <div className="h-28 overflow-hidden rounded-xl bg-ink-950">
        <img src={image.image.url} alt="" className="h-full w-full object-cover" />
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm font-semibold text-danger-600 hover:underline disabled:opacity-50"
      >
        {deleting ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  );
}

function HomeHeroGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data } = await api.get("/home-hero-images", { params: { all: "true" } });
    setImages(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleAdd() {
    if (!file) return;
    const confirmed = await confirmAction({
      title: "¿Agregar foto?",
      text: "Se va a sumar al carrusel de fotos del hero del home.",
      confirmText: "Sí, agregar",
      icon: "question"
    });
    if (!confirmed) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/home-hero-images", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toastSuccess("Foto agregada al hero del home");
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
      <p className="font-semibold text-ink-900">Home</p>
      <p className="mt-1 text-xs text-ink-500">
        Subí varias fotos y van a ir pasando en el hero del home. Si no cargás ninguna, se muestra el video por defecto.
      </p>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <HomeHeroImageCard key={img._id} image={img} onDeleted={handleDeleted} />
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
      <h1 className="text-2xl font-bold text-ink-900">Imágenes de fondo</h1>
      <p className="mt-1 text-sm text-ink-500">
        Fondo del hero de cada página. Si no cargás una imagen, se usa un fondo por defecto acorde a la marca.
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
