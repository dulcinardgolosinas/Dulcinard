import { Link } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { Button } from "../ui/Button";
import { formatCurrency, UNIT_LABELS } from "../../lib/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, setQuantity, removeItem, total } = useCartStore();
  const config = useSiteConfigStore((s) => s.config);
  const minPurchase = config?.minPurchaseAmount ?? 100000;
  const cartTotal = total();
  const missingForMin = Math.max(0, minPurchase - cartTotal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-ink-950/50" onClick={closeCart} aria-label="Cerrar carrito" />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-lg font-bold text-ink-900">Tu pedido ({items.length})</h2>
          <button onClick={closeCart} className="text-ink-400 hover:text-ink-900" aria-label="Cerrar">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-ink-400">
              <p className="text-sm">Todavía no agregaste productos.</p>
              <Link to="/catalogo" onClick={closeCart} className="mt-3 text-sm font-semibold text-brand-600">
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                    <p className="text-xs text-ink-400">{UNIT_LABELS[item.unit] || item.unit} · {formatCurrency(item.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-ink-200">
                        <button
                          className="px-2.5 py-1 text-ink-500"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-[2ch] text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          className="px-2.5 py-1 text-ink-500"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs font-medium text-ink-400 hover:text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-ink-900">{formatCurrency(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ink-100 px-5 py-4">
            {missingForMin > 0 ? (
              <p className="mb-3 rounded-xl bg-accent-50 px-3 py-2 text-xs font-medium text-accent-800">
                Te faltan {formatCurrency(missingForMin)} para alcanzar el mínimo de compra ({formatCurrency(minPurchase)}).
              </p>
            ) : (
              <p className="mb-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
                ¡Superaste el monto mínimo de compra!
              </p>
            )}
            <div className="mb-4 flex items-center justify-between text-base font-bold text-ink-900">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <Link to="/checkout" onClick={closeCart}>
              <Button variant="primary" className="w-full" size="lg" disabled={missingForMin > 0}>
                Finalizar pedido
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
