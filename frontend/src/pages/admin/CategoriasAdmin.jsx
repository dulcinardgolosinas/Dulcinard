import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";

function CategoryForm({ editing, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: editing?.name || "", description: editing?.description || "", active: editing?.active ?? true }
  });

  useEffect(() => {
    reset({ name: editing?.name || "", description: editing?.description || "", active: editing?.active ?? true });
    setFile(null);
  }, [editing, reset]);

  async function onSubmit(values) {
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
      reset({ name: "", description: "", active: true });
      setFile(null);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos guardar la categoría"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="font-semibold text-ink-900">{editing ? `Editando: ${editing.name}` : "Nueva categoría"}</p>
      <Input label="Nombre" {...register("name", { required: true })} />
      <Textarea label="Descripción" rows={2} {...register("description")} />
      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
        Activa (visible en el catálogo)
      </label>
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-700">Imagen de portada</p>
        {editing?.image?.url && !file && <img src={editing.image.url} alt="" className="mb-2 h-16 w-16 rounded-lg object-cover" />}
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    await api.delete(`/categories/${cat._id}`);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Categorías</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {loading ? (
            <PageLoader />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
              <table className="w-full text-left text-sm">
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
                        <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "Activa" : "Inactiva"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditing(c)} className="mr-3 text-sm font-semibold text-brand-600 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(c)} className="text-sm font-semibold text-red-600 hover:underline">
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
