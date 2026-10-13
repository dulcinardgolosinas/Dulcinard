import { ChevronLeft, ChevronRight } from "lucide-react";

// Números a mostrar: siempre la primera, la última y las vecinas de la
// actual; el resto se resume con "…". Ej: 1 … 4 5 6 … 20
function pageItems(page, pages) {
  const items = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) items.push(p);
    else if (items[items.length - 1] !== "…") items.push("…");
  }
  return items;
}

/**
 * Paginación reutilizable para los listados paginados del servidor
 * (respuesta { items, total, page, pages, limit }).
 */
export function Pagination({ page, pages, total, limit, onPageChange, itemLabel = "resultados", className = "" }) {
  if (!total) return null;

  // Al cambiar de página se vuelve arriba: si no, la vista queda en los botones del pie.
  function goTo(target) {
    onPageChange(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const navButton =
    "flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-100 disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      aria-label="Paginación"
      className={`mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row ${className}`}
    >
      <p className="text-sm text-ink-500">
        Mostrando <span className="font-semibold text-ink-800">{from}–{to}</span> de{" "}
        <span className="font-semibold text-ink-800">{total}</span> {itemLabel}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className={navButton}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>

          {pageItems(page, pages).map((item, i) =>
            item === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-ink-500">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goTo(item)}
                aria-current={item === page ? "page" : undefined}
                className={`h-9 min-w-9 rounded-full px-2 text-sm font-medium transition-colors ${
                  item === page ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page >= pages}
            className={navButton}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </nav>
  );
}
