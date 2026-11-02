import { CalendarDays } from "lucide-react";
import { formatCurrency } from "../../lib/format";
import { promoDateRange } from "../../lib/promotions";

/** Precio de la promo (con el normal tachado si está cargado) y las fechas. */
export function PromoInfo({ promo, size = "md" }) {
  const big = size === "lg";
  return (
    <div>
      {promo.price > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={`font-extrabold text-brand-600 ${big ? "text-3xl" : "text-2xl"}`}>{formatCurrency(promo.price)}</span>
          {promo.regularPrice > promo.price && (
            <span className="text-sm text-ink-400 line-through">{formatCurrency(promo.regularPrice)}</span>
          )}
        </div>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <CalendarDays className="h-3.5 w-3.5" />
        {promoDateRange(promo)}
      </p>
    </div>
  );
}

/** Etiqueta "20% OFF" sobre la foto. */
export function DiscountBadge({ percent, className = "" }) {
  if (!(percent > 0)) return null;
  return <span className={`rounded-full bg-brand-600 px-3 py-1 text-sm font-extrabold text-white shadow ${className}`}>{percent}% OFF</span>;
}
