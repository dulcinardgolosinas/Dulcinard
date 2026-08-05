import { Link } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { formatCurrency, UNIT_LABELS } from "../../lib/format";
import { Badge } from "../ui/Badge";

export function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const image = product.images?.[0]?.url;
  const outOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_40px_-16px_rgba(184,24,48,0.25)]">
      <Link to={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden bg-ink-50">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-200">
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="m3 16 5-5 4 4 5-6 4 5" />
            </svg>
          </div>
        )}
        {product.featured && (
          <Badge tone="accent" className="absolute left-2 top-2">
            Destacado
          </Badge>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Badge tone="danger">Sin stock</Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {product.brand && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{product.brand}</span>}
        <Link to={`/producto/${product.slug}`} className="line-clamp-2 text-sm font-semibold text-ink-900 hover:text-brand-600">
          {product.name}
        </Link>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <p className="text-base font-bold text-brand-700">{formatCurrency(product.price)}</p>
            <p className="text-[11px] font-medium text-ink-400">
              x {UNIT_LABELS[product.unit] || product.unit}
              {product.minOrderQty > 1 ? ` · mín. ${product.minOrderQty}` : ""}
            </p>
          </div>
          <button
            disabled={outOfStock}
            onClick={() => addItem(product, product.minOrderQty || 1)}
            aria-label="Agregar al carrito"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white transition-all hover:scale-110 hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
