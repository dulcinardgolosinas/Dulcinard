import { useEffect, useState, useCallback } from "react";
import { api, apiErrorMessage } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { useSearchFilters } from "../../lib/useSearchFilters";
import { useAuthStore } from "../../store/authStore";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";

const PAGE_SIZE = 20;

const FILTER_DEFAULTS = { q: "", role: "", page: "1" };

export default function UsuariosAdmin() {
  const [filters, setFilters] = useSearchFilters(FILTER_DEFAULTS);
  const currentUserId = useAuthStore((s) => s.user?._id);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(filters.q);
  const users = data.items;

  useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users", {
        params: { q: filters.q || undefined, role: filters.role || undefined, page: filters.page, limit: PAGE_SIZE }
      });
      setData(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cargar los usuarios"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRole(user) {
    const role = user.role === "admin" ? "cliente" : "admin";
    const confirmed = await confirmAction({
      title: "¿Cambiar rol?",
      text: `Vas a cambiar el rol de ${user.name} a "${role}".`,
      confirmText: "Sí, cambiar",
      icon: "question"
    });
    if (!confirmed) return;
    try {
      await api.put(`/users/${user._id}`, { role });
      toastSuccess("Rol actualizado");
      load();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cambiar el rol"));
    }
  }

  async function toggleActive(user) {
    const confirmed = await confirmAction({
      title: user.active ? "¿Bloquear usuario?" : "¿Reactivar usuario?",
      text: user.active
        ? `${user.name} no va a poder iniciar sesión hasta que lo reactives.`
        : `${user.name} va a poder volver a iniciar sesión.`,
      confirmText: user.active ? "Sí, bloquear" : "Sí, reactivar",
      icon: "warning"
    });
    if (!confirmed) return;
    try {
      await api.put(`/users/${user._id}`, { active: !user.active });
      toastSuccess(user.active ? "Usuario bloqueado" : "Usuario reactivado");
      load();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos actualizar el usuario"));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Usuarios</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ q: q.trim() });
        }}
        className="mt-5 flex flex-wrap gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, negocio o email..."
          aria-label="Buscar usuarios"
          className="w-full max-w-sm rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters({ role: e.target.value })}
          aria-label="Filtrar por rol"
          className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Todos los roles</option>
          <option value="cliente">Clientes</option>
          <option value="admin">Administradores</option>
        </select>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
        {(filters.q || filters.role) && (
          <Button type="button" variant="ghost" onClick={() => setFilters({ q: "", role: "" })}>
            Limpiar
          </Button>
        )}
      </form>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Negocio</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                    <td className="px-4 py-3 text-ink-500">{u.email}</td>
                    <td className="px-4 py-3 text-ink-500">{u.businessName || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role === "admin" ? "brand" : "neutral"}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.active ? "success" : "danger"}>{u.active ? "Activo" : "Bloqueado"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u._id === currentUserId ? (
                        <span className="text-xs text-ink-500">Tu cuenta</span>
                      ) : (
                        <>
                          <button onClick={() => toggleRole(u)} className="mr-3 text-sm font-semibold text-brand-600 hover:underline">
                            {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                          </button>
                          <button onClick={() => toggleActive(u)} className="text-sm font-semibold text-danger-600 hover:underline">
                            {u.active ? "Bloquear" : "Reactivar"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            limit={data.limit || PAGE_SIZE}
            itemLabel="usuarios"
            onPageChange={(page) => setFilters({ page })}
          />
        </>
      )}
    </div>
  );
}
