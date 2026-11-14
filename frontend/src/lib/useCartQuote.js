import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "../store/authStore";

/**
 * Cuánto sale el carrito según el servidor: promos (2x1, precio especial...),
 * descuento de primera compra y envío. Es lo mismo que se va a cobrar.
 * Se vuelve a pedir (con una pequeña espera) cada vez que cambia el carrito o la zona.
 */
export function useCartQuote(items, zone, { enabled = true } = {}) {
  const token = useAuthStore((s) => s.token);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([items.map((i) => [i.productId, i.quantity]), zone || "", token || ""]);

  useEffect(() => {
    if (!enabled || !items.length) {
      setQuote(null);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .post("/orders/quote", { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), zone: zone || undefined })
        .then(({ data }) => active && setQuote(data))
        .catch(() => active && setQuote(null)) // sin cotización se muestran los precios del carrito
        .finally(() => active && setLoading(false));
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { quote, loading };
}
