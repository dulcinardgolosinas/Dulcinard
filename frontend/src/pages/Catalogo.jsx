import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { ProductCard } from "../components/product/ProductCard";
import { PageLoader, Spinner } from "../components/ui/Spinner";
import { Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { UNIT_LABELS } from "../lib/format";

const UNITS = Object.keys(UNIT_LABELS);

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const unit = searchParams.get("unit") || "";
  const featured = searchParams.get("featured") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
    api.get("/products/brands").then(({ data }) => setBrands(data));
  }, []);

  const fetchProducts = useCallback(
    async (targetPage, replace) => {
      replace ? setLoading(true) : setLoadingMore(true);
      try {
        const { data } = await api.get("/products", {
          params: { q, category, brand, unit, featured, minPrice, maxPrice, page: targetPage, limit: 24 }
        });
        setProducts((prev) => (replace ? data.items : [...prev, ...data.items]));
        setPages(data.pages);
        setPage(data.page);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, category, brand, unit, featured, minPrice, maxPrice]
  );

  useEffect(() => {
    fetchProducts(1, true);
  }, [fetchProducts]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  const FiltersPanel = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Categoría</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilter("category", "")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              !category ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600"
            }`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => updateFilter("category", c._id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                category === c._id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <Select label="Marca" value={brand} onChange={(e) => updateFilter("brand", e.target.value)}>
        <option value="">Todas las marcas</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </Select>

      <Select label="Presentación" value={unit} onChange={(e) => updateFilter("unit", e.target.value)}>
        <option value="">Todas</option>
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {UNIT_LABELS[u]}
          </option>
        ))}
      </Select>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Rango de precio</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mín."
            value={minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <span className="text-ink-300">–</span>
          <input
            type="number"
            placeholder="Máx."
            value={maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {(category || brand || unit || minPrice || maxPrice || featured) && (
        <button
          onClick={() => setSearchParams(q ? { q } : {})}
          className="text-xs font-semibold text-brand-600 hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Catálogo</h1>
          <p className="text-sm text-ink-500">Precios mayoristas — comprá por unidad, caja o display</p>
        </div>
        <div className="relative">
          <input
            type="search"
            defaultValue={q}
            placeholder="Buscar producto o marca..."
            onKeyDown={(e) => e.key === "Enter" && updateFilter("q", e.currentTarget.value)}
            onBlur={(e) => updateFilter("q", e.currentTarget.value)}
            className="w-full min-w-[260px] rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700 lg:hidden"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filtros
      </button>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>{FiltersPanel}</aside>

        <div>
          {loading ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <p className="py-20 text-center text-ink-400">No encontramos productos con esos filtros.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {page < pages && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={() => fetchProducts(page + 1, false)} disabled={loadingMore}>
                    {loadingMore ? <Spinner className="h-4 w-4" /> : "Cargar más productos"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
