import { useEffect, useState, useCallback } from "react";
import { api, apiErrorMessage } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";

export default function UsuariosAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async (query = q) => {
    setLoading(true);
    const { data } = await api.get("/users", { params: { q: query, limit: 50 } });
    setUsers(data.items);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="mt-5 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Buscar por nombre, negocio o email..."
          className="w-full max-w-sm rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : (
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
                    <button onClick={() => toggleRole(u)} className="mr-3 text-sm font-semibold text-brand-600 hover:underline">
                      {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                    </button>
                    <button onClick={() => toggleActive(u)} className="text-sm font-semibold text-red-600 hover:underline">
                      {u.active ? "Bloquear" : "Reactivar"}
                    </button>
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
      )}
    </div>
  );
}
