import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { formatCurrency, UNIT_LABELS } from "../../lib/format";

export default function ProductosAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async (targetPage = 1, query = q) => {
    setLoading(true);
    const { data } = await api.get("/products", { params: { q: query, all: "true", page: targetPage, limit: 20 } });
    setProducts(data.items);
    setPages(data.pages);
    setPage(data.page);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(product) {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    await api.delete(`/products/${product._id}`);
    load(page);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Productos</h1>
        <Link to="/admin/productos/nuevo">
          <Button>+ Nuevo producto</Button>
        </Link>
      </div>

      <div className="mt-5 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(1)}
          placeholder="Buscar por nombre, marca o descripción..."
          className="w-full max-w-sm rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <Button variant="outline" onClick={() => load(1)}>
          Buscar
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t border-ink-50">
                  <td className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                      {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">{p.name}</p>
                      <p className="text-xs text-ink-400">{p.category?.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-ink-500">{UNIT_LABELS[p.unit] || p.unit}</td>
                  <td className="px-4 py-3 text-ink-500">{p.stock}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.active ? "success" : "neutral"}>{p.active ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/productos/${p._id}/editar`} className="mr-3 text-sm font-semibold text-brand-600 hover:underline">
                      Editar
                    </Link>
                    <button onClick={() => handleDelete(p)} className="text-sm font-semibold text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                    No hay productos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => load(p)}
              className={`h-8 w-8 rounded-full text-sm font-medium ${
                p === page ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-ink-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
