import { Link } from "react-router-dom";
import { Gift, Tag } from "lucide-react";
import { formatCurrency } from "../../lib/format";

/** Aviso del descuento de primera compra: "lo tenés" o "registrate y obtenelo". */
export function FirstPurchaseNotice({ quote, onNavigate }) {
  const fp = quote?.firstPurchase;
  if (!fp) return null;
  if (fp.eligible) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white">
        <Gift className="h-4 w-4 shrink-0" /> ¡Es tu primera compra! Tenés {fp.percent}% de descuento.
      </p>
    );
  }
  if (fp.reason === "guest" && fp.percent > 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
        <Gift className="h-4 w-4 shrink-0" />
        <span>
          <Link to="/registro" onClick={onNavigate} className="underline">
            Registrate
          </Link>{" "}
          y obtené {fp.percent}% en tu primera compra.
        </span>
      </p>
    );
  }
  return null;
}

/**
 * Resumen con lo que calcula el servidor: precio de cada producto con su promo,
 * descuento de primera compra, envío y total. Mientras llega, usa `fallback`.
 */
export function QuoteSummary({ quote, fallbackItems, fallbackShipping, showItems = true, hideShipping = false }) {
  const items = quote?.items || [];
  const productsTotal = quote ? quote.itemsTotal + (quote.promoSavings || 0) : fallbackItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = quote ? quote.shippingCost : fallbackShipping;
  const firstPurchase = quote?.firstPurchaseDiscount?.amount || 0;
  // Sin envío (ej: en el carrito, antes de elegir la zona) el total es solo de productos.
  const total = quote ? quote.total - (hideShipping ? quote.shippingCost : 0) : productsTotal + (hideShipping ? 0 : fallbackShipping || 0);

  return (
    <div>
      {showItems && (
        <ul className="space-y-3">
          {(quote ? items : fallbackItems).map((item) => (
            <li key={item.product || item.productId} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-ink-600">
                  {item.quantity} x {item.name}
                </span>
                <span className="shrink-0 font-medium text-ink-900">
                  {formatCurrency(quote ? (item.listPrice ?? item.unitPrice) * item.quantity : item.price * item.quantity)}
                </span>
              </div>
              {item.promotion && item.promoDiscount > 0 && (
                <div className="mt-0.5 flex justify-between gap-3 text-xs font-semibold text-brand-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {item.promotion.label} · {item.promotion.title}
                  </span>
                  <span className="shrink-0">−{formatCurrency(item.promoDiscount)}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className={`space-y-1.5 text-sm ${showItems ? "mt-4 border-t border-ink-100 pt-4" : ""}`}>
        <div className="flex justify-between text-ink-600">
          <span>Productos</span>
          <span>{formatCurrency(productsTotal)}</span>
        </div>
        {quote?.promoSavings > 0 && (
          <div className="flex justify-between font-semibold text-brand-600">
            <span>Promociones</span>
            <span>−{formatCurrency(quote.promoSavings)}</span>
          </div>
        )}
        {firstPurchase > 0 && (
          <div className="flex justify-between font-semibold text-brand-600">
            <span>Primera compra ({quote.firstPurchaseDiscount.percent}%)</span>
            <span>−{formatCurrency(firstPurchase)}</span>
          </div>
        )}
        {!hideShipping && shipping !== undefined && (
          <div className="flex justify-between text-ink-600">
            <span>Envío</span>
            <span>{shipping > 0 ? formatCurrency(shipping) : "Gratis"}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-900">
          <span>{hideShipping ? "Subtotal (sin envío)" : "Total"}</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
