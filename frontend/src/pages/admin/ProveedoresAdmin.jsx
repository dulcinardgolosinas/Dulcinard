import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowUp, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Pagination } from "../../components/ui/Pagination";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";

const PAGE_SIZE = 10;

const schema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(60, "El nombre puede tener hasta 60 caracteres"),
  active: z.boolean()
});

// Qué ve el cliente en la página principal con cada proveedor.
function visibility(provider) {
  if (!provider.active) return { label: "Oculto", tone: "bg-ink-100 text-ink-600" };
  if (!provider.logo?.url) return { label: "No se ve: falta el logo", tone: "border border-brand-200 bg-white text-brand-600" };
  return { label: "Se ve en el inicio", tone: "bg-brand-600 text-white" };
}

// Formulario único para agregar o editar: nombre, logo y si se muestra.
function ProviderForm({ editing, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: editing?.name || "", active: editing?.active ?? true }
  });

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setRemoveLogo(false);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  const currentLogo = preview || (!removeLogo && editing?.logo?.url) || null;

  async function onSubmit(values) {
    const confirmed = await confirmAction({
      title: editing ? "¿Guardar los cambios?" : "¿Agregar este proveedor?",
      text: editing
        ? `Se actualizan los datos de "${editing.name}".`
        : `"${values.name}" se suma a la lista${values.active && file ? " y aparece en la página principal" : ""}.`,
      confirmText: editing ? "Sí, guardar" : "Sí, agregar",
      icon: "question"
    });
    if (!confirmed) return;

    try {
      let saved;
      if (editing) {
        ({ data: saved } = await api.put(`/providers/${editing._id}`, values));
        if (file) {
          const formData = new FormData();
          formData.append("logo", file);
          ({ data: saved } = await api.put(`/providers/${editing._id}/logo`, formData, { headers: { "Content-Type": "multipart/form-data" } }));
        } else if (removeLogo && editing.logo?.url) {
          ({ data: saved } = await api.delete(`/providers/${editing._id}/logo`));
        }
      } else {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("active", String(values.active));
        if (file) formData.append("logo", file);
        ({ data: saved } = await api.post("/providers", formData, { headers: { "Content-Type": "multipart/form-data" } }));
      }
      toastSuccess(editing ? "Proveedor actualizado" : "Proveedor agregado");
      onSaved(saved);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar el proveedor"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toastError("Revisá los datos marcados en rojo"))}
      className="rounded-2xl border-2 border-brand-200 bg-white p-5"
    >
      <p className="font-semibold text-ink-900">{editing ? `Editar: ${editing.name}` : "Nuevo proveedor"}</p>

      <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <Input label="Nombre de la marca" placeholder="Ej: Arcor" {...register("name")} error={errors.name?.message} />
          <label className="flex items-start gap-2 text-sm text-ink-700">
            <input type="checkbox" {...register("active")} className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-brand-600" />
            <span>
              <span className="font-medium">Mostrar en la página principal</span>
              <span className="block text-xs text-ink-500">Aparece en "Marcas con las que trabajamos" (solo si tiene logo).</span>
            </span>
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">Logo</p>
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 p-3">
            {currentLogo ? (
              <img src={currentLogo} alt="" className="h-full max-w-full object-contain" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs text-ink-400">
                <ImageOff className="h-5 w-5" />
                Sin logo
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FileInput buttonLabel={currentLogo ? "Cambiar logo" : "Elegir logo"} onChange={handleFile} />
            {currentLogo && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setRemoveLogo(true);
                }}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Quitar logo
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500">Mejor PNG con fondo transparente.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : editing ? "Guardar cambios" : "Agregar proveedor"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ProviderRow({ provider, position, total, onEdit, onDelete, onMove }) {
  const status = visibility(provider);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 sm:flex-nowrap">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={position === 1}
          aria-label={`Subir ${provider.name}`}
          className="rounded-md p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={position === total}
          aria-label={`Bajar ${provider.name}`}
          className="rounded-md p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>
      <span className="w-6 text-center text-sm font-semibold text-ink-400">{position}</span>
      <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl border border-ink-100 bg-ink-50 p-1.5">
        {provider.logo?.url ? (
          <img src={provider.logo.url} alt={provider.name} className="h-full max-w-full object-contain" />
        ) : (
          <ImageOff className="h-5 w-5 text-ink-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink-900">{provider.name}</p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${status.tone}`}>{status.label}</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label={`Eliminar ${provider.name}`} className="text-brand-600">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Eliminar</span>
        </Button>
      </div>
    </li>
  );
}

export default function ProveedoresAdmin() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = cerrado, "new" = agregar, objeto = editar
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get("/providers", { params: { all: "true" } })
      .then(({ data }) => setProviders(data))
      .catch((err) => toastError(apiErrorMessage(err, "No pudimos cargar los proveedores")))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(saved) {
    const isNew = !providers.some((p) => p._id === saved._id);
    setProviders((prev) => (isNew ? [...prev, saved] : prev.map((p) => (p._id === saved._id ? saved : p))));
    // Los nuevos van al final: se muestra la última página para verlo.
    if (isNew) setPage(Math.ceil((providers.length + 1) / PAGE_SIZE));
    setEditing(null);
  }

  async function handleDelete(provider) {
    const confirmed = await confirmDelete(`el proveedor "${provider.name}" y su logo`);
    if (!confirmed) return;
    try {
      await api.delete(`/providers/${provider._id}`);
      setProviders((prev) => prev.filter((p) => p._id !== provider._id));
      // Si era el único de la última página, se vuelve a la anterior.
      setPage((current) => Math.min(current, Math.max(1, Math.ceil((providers.length - 1) / PAGE_SIZE))));
      if (editing?._id === provider._id) setEditing(null);
      toastSuccess("Proveedor eliminado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar el proveedor"));
    }
  }

  // Cambia el orden del carrusel intercambiando con el de al lado.
  async function handleMove(index, step) {
    const other = providers[index + step];
    if (!other) return;
    const confirmed = await confirmAction({
      title: "¿Cambiar el orden?",
      text: `"${providers[index].name}" pasa al lugar ${index + step + 1} del carrusel.`,
      confirmText: "Sí, mover",
      icon: "question"
    });
    if (!confirmed) return;
    const reordered = [...providers];
    [reordered[index], reordered[index + step]] = [reordered[index + step], reordered[index]];
    try {
      await Promise.all(reordered.map((p, i) => (p.order === i ? null : api.put(`/providers/${p._id}`, { order: i }))));
      setProviders(reordered.map((p, i) => ({ ...p, order: i })));
      toastSuccess("Orden actualizado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiar el orden"));
    }
  }

  if (loading) return <PageLoader />;

  const visibleCount = providers.filter((p) => p.active && p.logo?.url).length;
  const pages = Math.max(1, Math.ceil(providers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageProviders = providers.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Proveedores</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            Las marcas con las que trabajan. Las que tienen logo y están marcadas para mostrarse aparecen en el carrusel "Marcas
            con las que trabajamos" de la página principal, en este orden.
          </p>
        </div>
        {editing !== "new" && (
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            Agregar proveedor
          </Button>
        )}
      </div>

      {editing === "new" && (
        <div className="mt-5">
          <ProviderForm editing={null} onSaved={handleSaved} onCancel={() => setEditing(null)} />
        </div>
      )}

      <p className="mt-6 text-xs font-medium text-ink-500">
        {providers.length} proveedor(es) · {visibleCount} se ven en la página principal
      </p>

      {providers.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-ink-100 bg-white px-5 py-8 text-center text-sm text-ink-500">
          Todavía no hay proveedores. Tocá "Agregar proveedor" para cargar el primero.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pageProviders.map((p, pageIndex) => {
            const i = offset + pageIndex; // posición en todo el carrusel
            return editing?._id === p._id ? (
              <li key={p._id}>
                <ProviderForm editing={p} onSaved={handleSaved} onCancel={() => setEditing(null)} />
              </li>
            ) : (
              <ProviderRow
                key={p._id}
                provider={p}
                position={i + 1}
                total={providers.length}
                onEdit={() => setEditing(p)}
                onDelete={() => handleDelete(p)}
                onMove={(step) => handleMove(i, step)}
              />
            );
          })}
        </ul>
      )}

      <Pagination
        className="mt-5"
        page={currentPage}
        pages={pages}
        total={providers.length}
        limit={PAGE_SIZE}
        onPageChange={(p) => {
          setEditing((e) => (e === "new" ? e : null));
          setPage(p);
        }}
        itemLabel="proveedores"
      />
    </div>
  );
}
