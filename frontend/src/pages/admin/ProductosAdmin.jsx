import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, FileSpreadsheet, ImagePlus, Upload } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { formatCurrency, UNIT_LABELS, needsRestock } from "../../lib/format";
import { useSearchFilters } from "../../lib/useSearchFilters";
import { confirmDelete, toastSuccess, toastError } from "../../lib/alerts";

const PAGE_SIZE = 20;

const FILTER_DEFAULTS = { search: "", category: "", minPrice: "", maxPrice: "", stock: "", page: "1" };

const STOCK_OPTIONS = [
  { value: "", label: "Todo el stock" },
  { value: "low", label: "Reponer stock (en o bajo el mínimo)" },
  { value: "out", label: "Sin stock" },
  { value: "ok", label: "Stock OK" }
];

const fieldClass =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500";

export default function ProductosAdmin() {
  const [filters, setFilters] = useSearchFilters(FILTER_DEFAULTS);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1, limit: PAGE_SIZE });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // Los campos de texto se aplican al enviar el formulario, no en cada tecla.
  const [draft, setDraft] = useState({ search: filters.search, minPrice: filters.minPrice, maxPrice: filters.maxPrice });

  useEffect(() => {
    api.get("/categories", { params: { all: "true" } }).then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    setDraft({ search: filters.search, minPrice: filters.minPrice, maxPrice: filters.maxPrice });
  }, [filters.search, filters.minPrice, filters.maxPrice]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: {
          all: "true",
          search: filters.search || undefined,
          category: filters.category || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          stockStatus: filters.stock || undefined,
          page: filters.page,
          limit: PAGE_SIZE
        }
      });
      setData(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cargar los productos"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function applyTextFilters(e) {
    e.preventDefault();
    setFilters(draft);
  }

  function clearFilters() {
    setFilters({ search: "", category: "", minPrice: "", maxPrice: "", stock: "" });
  }

  async function handleDelete(product) {
    const confirmed = await confirmDelete(`el producto "${product.name}"`);
    if (!confirmed) return;
    try {
      await api.delete(`/products/${product._id}`);
      toastSuccess("Producto eliminado");
      load();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos eliminar el producto"));
    }
  }

  const hasFilters = Boolean(filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.stock);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Productos</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/productos/importar">
            <Button variant="outline">
              <Upload className="h-4 w-4" strokeWidth={2} />
              Cargar / actualizar precios
            </Button>
          </Link>
          <Link to="/admin/productos/stock">
            <Button variant="outline">
              <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
              Stock en Excel
            </Button>
          </Link>
          <Link to="/admin/productos/fotos">
            <Button variant="outline">
              <ImagePlus className="h-4 w-4" strokeWidth={2} />
              Subir fotos
            </Button>
          </Link>
          <Link to="/admin/productos/nuevo">
            <Button>+ Nuevo producto</Button>
          </Link>
        </div>
      </div>

      <form
        onSubmit={applyTextFilters}
        className="mt-5 grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1.4fr_auto]"
      >
        <input
          value={draft.search}
          onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
          placeholder="Buscar por nombre, código o marca..."
          aria-label="Buscar productos"
          className={fieldClass}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value })}
          aria-label="Filtrar por categoría"
          className={fieldClass}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={draft.minPrice}
          onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))}
          placeholder="Precio mín."
          aria-label="Precio mínimo"
          className={fieldClass}
        />
        <input
          type="number"
          min="0"
          value={draft.maxPrice}
          onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))}
          placeholder="Precio máx."
          aria-label="Precio máximo"
          className={fieldClass}
        />
        <select
          value={filters.stock}
          onChange={(e) => setFilters({ stock: e.target.value })}
          aria-label="Filtrar por estado de stock"
          className={fieldClass}
        >
          {STOCK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            Buscar
          </Button>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Limpiar
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
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
                {data.items.map((p) => {
                  const restock = needsRestock(p);
                  return (
                    <tr
                      key={p._id}
                      className={`border-t ${restock ? "border-danger-100 bg-danger-50" : "border-ink-50"}`}
                    >
                      <td className={`px-4 py-3 ${restock ? "border-l-4 border-danger-600" : "border-l-4 border-transparent"}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                            {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full bg-white object-contain" />}
                          </div>
                          <div>
                            <p className="font-medium text-ink-900">{p.name}</p>
                            <p className="text-xs text-ink-500">
                              {p.category?.name}
                              {p.sku && ` · Código ${p.sku}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-700">{formatCurrency(p.price)}</td>
                      <td className="px-4 py-3 text-ink-600">{UNIT_LABELS[p.unit] || p.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={restock ? "font-bold text-danger-700" : "text-ink-600"}>
                            {p.stock}
                            <span className="ml-1 text-xs font-normal text-ink-500">/ mín. {p.minStock ?? 0}</span>
                          </span>
                          {restock && (
                            <Badge tone="alert">
                              <AlertTriangle className="mr-1 h-3 w-3" strokeWidth={2.5} />
                              Reponer stock
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={p.active ? "success" : "neutral"}>{p.active ? "Visible" : "Oculto"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/admin/productos/${p._id}/editar`} className="mr-3 text-sm font-semibold text-brand-600 hover:underline">
                          Editar
                        </Link>
                        <button onClick={() => handleDelete(p)} className="text-sm font-semibold text-danger-600 hover:underline">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                      No hay productos que coincidan con los filtros.
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
            itemLabel="productos"
            onPageChange={(page) => setFilters({ page })}
          />
        </>
      )}
    </div>
  );
}
