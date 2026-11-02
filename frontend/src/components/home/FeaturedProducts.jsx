import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import { ProductCard } from "../product/ProductCard";

const SHOW = 10;

function CardSkeleton() {
  return (
    <div className="w-[44%] shrink-0 snap-start overflow-hidden rounded-2xl border border-ink-100 bg-white sm:w-[30%] lg:w-auto" aria-hidden="true">
      <div className="aspect-square animate-pulse bg-ink-100" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-ink-100" />
      </div>
    </div>
  );
}

// Fila de productos arriba de todo, para que se vean apenas se entra a la
// tienda: los marcados como "Destacado" en el panel y, si no alcanzan, los
// más nuevos.
export function FeaturedProducts() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const featured = (await api.get("/products", { params: { featured: "true", limit: SHOW, sort: "-createdAt" } })).data.items;
        let list = featured;
        if (featured.length < SHOW) {
          const newest = (await api.get("/products", { params: { limit: SHOW * 2, sort: "-createdAt" } })).data.items;
          const ids = new Set(featured.map((p) => p._id));
          list = [...featured, ...newest.filter((p) => !ids.has(p._id) && p.images?.length)].slice(0, SHOW);
        }
        if (active) setProducts(list);
      } catch {
        if (active) setProducts([]);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (products && products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-ink-900 md:text-2xl">Productos destacados</h2>
        <Link to="/catalogo" className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          Ver todos
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </div>

      {/* Celular y tablet: se desliza de costado (hasta 10). Compu: una fila de 5. */}
      <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {products
          ? products.map((p, i) => (
              <div key={p._id} className={`w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-auto ${i >= 5 ? "lg:hidden" : ""}`}>
                <ProductCard product={p} />
              </div>
            ))
          : Array.from({ length: 5 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    </section>
  );
}
