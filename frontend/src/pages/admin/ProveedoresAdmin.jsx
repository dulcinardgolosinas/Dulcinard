import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../lib/api";
import { FileInput } from "../../components/ui/FileInput";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { confirmAction, confirmDelete, promptText, toastSuccess, toastError } from "../../lib/alerts";

function ProviderCard({ provider, onChanged }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [order, setOrder] = useState(provider.order);

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function uploadLogo() {
    if (!file) return;
    const confirmed = await confirmAction({
      title: provider.logo?.url ? "¿Reemplazar logo?" : "¿Subir logo?",
      text: `Vas a actualizar el logo de ${provider.name}.`,
      confirmText: "Sí, subir",
      icon: "question"
    });
    if (!confirmed) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const { data } = await api.put(`/providers/${provider._id}/logo`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toastSuccess(`Logo de ${provider.name} actualizado`);
      setFile(null);
      setPreview(null);
      onChanged(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos subir el logo"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteLogo() {
    const confirmed = await confirmDelete(`el logo de ${provider.name}`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { data } = await api.delete(`/providers/${provider._id}/logo`);
      toastSuccess(`Logo de ${provider.name} eliminado`);
      onChanged(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar el logo"));
    } finally {
      setDeleting(false);
    }
  }

  async function rename() {
    const name = await promptText({
      title: "Cambiar nombre",
      label: "Nombre del proveedor",
      value: provider.name,
      validate: (text) => (text.length < 2 || text.length > 60 ? "El nombre debe tener entre 2 y 60 caracteres" : null)
    });
    if (!name || name === provider.name) return;
    try {
      const { data } = await api.put(`/providers/${provider._id}`, { name });
      onChanged(data);
      toastSuccess("Nombre actualizado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiar el nombre"));
    }
  }

  async function toggleActive() {
    const confirmed = await confirmAction({
      title: provider.active ? "¿Ocultar este proveedor?" : "¿Mostrar este proveedor?",
      text: provider.active
        ? `"${provider.name}" deja de verse en la página principal. Podés volver a mostrarlo cuando quieras.`
        : `"${provider.name}" vuelve a verse en la página principal.`,
      confirmText: provider.active ? "Sí, ocultar" : "Sí, mostrar",
      icon: "question"
    });
    if (!confirmed) return;
    try {
      const { data } = await api.put(`/providers/${provider._id}`, { active: !provider.active });
      onChanged(data);
      toastSuccess(data.active ? "Proveedor visible en la tienda" : "Proveedor oculto");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos actualizar el proveedor"));
    }
  }

  async function saveOrder() {
    if (order === provider.order) return;
    const confirmed = await confirmAction({
      title: "¿Cambiar la posición?",
      text: `"${provider.name}" va a aparecer en la posición ${order}.`,
      confirmText: "Sí, cambiar",
      icon: "question"
    });
    if (!confirmed) return setOrder(provider.order);
    try {
      const { data } = await api.put(`/providers/${provider._id}`, { order });
      toastSuccess("Posición actualizada");
      onChanged(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos actualizar el orden"));
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{provider.name}</p>
          <button type="button" onClick={rename} className="text-xs font-semibold text-brand-600 hover:underline">
            Cambiar nombre
          </button>
        </div>
        <Badge tone={provider.active ? "success" : "neutral"}>{provider.active ? "Visible" : "Oculto"}</Badge>
      </div>

      <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 p-2">
        {preview || provider.logo?.url ? (
          <img src={preview || provider.logo.url} alt={provider.name} className="h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-ink-400">Sin logo cargado</span>
        )}
      </div>

      <FileInput onChange={handleFile} />

      <div className="flex gap-2">
        {file && (
          <Button type="button" size="sm" variant="outline" onClick={uploadLogo} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner className="h-4 w-4" /> Subiendo...
              </>
            ) : (
              "Subir logo"
            )}
          </Button>
        )}
        {provider.logo?.url && !file && (
          <button
            type="button"
            onClick={handleDeleteLogo}
            disabled={deleting}
            className="text-sm font-semibold text-danger-600 hover:underline disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar logo"}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink-50 pt-3">
        <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
          Orden
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            onBlur={saveOrder}
            className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
          <input type="checkbox" checked={provider.active} onChange={toggleActive} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
          Mostrar en el home
        </label>
      </div>
    </div>
  );
}

export default function ProveedoresAdmin() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get("/providers", { params: { all: "true" } });
    setProviders(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleChanged(updated) {
    setProviders((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Proveedores</h1>
      <p className="mt-1 text-sm text-ink-500">
        Subí el logo de cada marca para que aparezca en el carrusel "Marcas con las que trabajamos" del home. Solo se
        muestran los proveedores activos que ya tienen un logo cargado.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <ProviderCard key={p._id} provider={p} onChanged={handleChanged} />
        ))}
      </div>
    </div>
  );
}
