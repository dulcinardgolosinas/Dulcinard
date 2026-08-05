import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";

const emptyBranch = () => ({
  name: "",
  address: "",
  phone: "",
  mapUrl: "",
  active: true,
  order: 0,
  schedule: {
    weekdays: { label: "Lunes a Viernes", hours: "" },
    saturday: { label: "Sábado", hours: "" }
  }
});

export default function SucursalesAdmin() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/site-config").then(({ data }) => {
      setBranches(data.branches?.length ? data.branches : []);
      setLoading(false);
    });
  }, []);

  function update(index, path, value) {
    setBranches((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let target = next[index];
      for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]];
      target[keys.at(-1)] = value;
      return next;
    });
  }

  function addBranch() {
    setBranches((prev) => [...prev, emptyBranch()]);
  }

  function removeBranch(index) {
    if (!confirm("¿Eliminar esta sucursal?")) return;
    setBranches((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    await api.put("/site-config", { branches: JSON.stringify(branches) });
    setSaving(false);
    setMessage("Sucursales actualizadas correctamente.");
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Sucursales</h1>
        <Button variant="outline" onClick={addBranch}>
          + Agregar sucursal
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {branches.map((b, i) => (
          <div key={i} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nombre" value={b.name} onChange={(e) => update(i, "name", e.target.value)} />
              <Input label="Dirección" value={b.address} onChange={(e) => update(i, "address", e.target.value)} />
              <Input label="Teléfono (opcional)" value={b.phone} onChange={(e) => update(i, "phone", e.target.value)} />
              <Input label="Link de Google Maps (opcional)" value={b.mapUrl} onChange={(e) => update(i, "mapUrl", e.target.value)} />
              <Input
                label="Horario Lunes a Viernes"
                placeholder="8:30 a 21 hs"
                value={b.schedule.weekdays.hours}
                onChange={(e) => update(i, "schedule.weekdays.hours", e.target.value)}
              />
              <Input
                label="Horario Sábado"
                placeholder="9 a 13 y 17 a 20 hs"
                value={b.schedule.saturday.hours}
                onChange={(e) => update(i, "schedule.saturday.hours", e.target.value)}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={b.active}
                  onChange={(e) => update(i, "active", e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600"
                />
                Sucursal activa
              </label>
              <button onClick={() => removeBranch(i)} className="text-sm font-semibold text-red-600 hover:underline">
                Eliminar sucursal
              </button>
            </div>
          </div>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      <div className="mt-6">
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : "Guardar sucursales"}
        </Button>
      </div>
    </div>
  );
}
