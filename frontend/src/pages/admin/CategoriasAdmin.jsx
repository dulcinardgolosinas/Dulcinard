import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { nameField } from "../../lib/validators";

const schema = z.object({
  name: nameField("El nombre de la categoría", { min: 2, max: 60 }),
  description: z.string().trim().max(500, "La descripción no puede superar los 500 caracteres").optional(),
  active: z.boolean().optional()
});

function CategoryForm({ editing, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: editing?.name || "", description: editing?.description || "", active: editing?.active ?? true }
  });

  useEffect(() => {
    reset({ name: editing?.name || "", description: editing?.description || "", active: editing?.active ?? true });
    setFile(null);
  }, [editing, reset]);

  async function onSubmit(values) {
    if (editing) {
      const confirmed = await confirmAction({
        title: "¿Guardar cambios?",
        text: "Vas a actualizar esta categoría.",
        confirmText: "Sí, guardar",
        icon: "question"
      });
      if (!confirmed) return;
    }

    setError("");
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append("image", file);

    try {
      if (editing) {
        await api.put(`/categories/${editing._id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/categories", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toastSuccess(editing ? "Categoría actualizada" : "Categoría creada");
      reset({ name: "", description: "", active: true });
      setFile(null);
      onSaved();
    } catch (err) {
      const message = apiErrorMessage(err, "No pudimos guardar la categoría");
      setError(message);
      toastError(message);
    }
  }

  function onInvalid() {
    toastError("Completá los campos obligatorios antes de guardar");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="font-semibold text-ink-900">{editing ? `Editando: ${editing.name}` : "Nueva categoría"}</p>
      <Input label="Nombre" {...register("name")} error={errors.name?.message} />
      <Textarea label="Descripción" rows={2} {...register("description")} error={errors.description?.message} />
      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
        Visible en la tienda
      </label>
      <div>
        {editing?.image?.url && !file && <img src={editing.image.url} alt="" className="mb-2 h-16 w-16 rounded-lg object-cover" />}
        <FileInput label="Imagen de portada" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : editing ? "Guardar cambios" : "Crear categoría"}
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

export default function CategoriasAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/categories", { params: { all: "true" } });
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(cat) {
    const confirmed = await confirmDelete(`la categoría "${cat.name}"`);
    if (!confirmed) return;
    try {
      await api.delete(`/categories/${cat._id}`);
      toastSuccess("Categoría eliminada");
      load();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar la categoría"));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Categorías</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {loading ? (
            <PageLoader />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
                  <tr>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c._id} className="border-t border-ink-50">
                      <td className="flex items-center gap-3 px-4 py-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                          {c.image?.url && <img src={c.image.url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        {c.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "Visible" : "Oculta"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditing(c)} className="mr-3 text-sm font-semibold text-brand-600 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(c)} className="text-sm font-semibold text-danger-600 hover:underline">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-ink-400">
                        Todavía no cargaste categorías.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <CategoryForm editing={editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
      </div>
    </div>
  );
}
