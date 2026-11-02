import { MessageCircle, Tag } from "lucide-react";
import { api } from "./api";

// Promociones vigentes para la página principal y el cartel de bienvenida.
// Se guardan un rato en el navegador: al volver se muestran al instante y las
// dos partes comparten un solo pedido al servidor.
const CACHE_KEY = "home-promotions";
const CACHE_MS = 5 * 60 * 1000;
let memoryCache = null;
let pending = null;

export function readCachedPromotions() {
  if (memoryCache && Date.now() - memoryCache.at < CACHE_MS) return memoryCache.data;
  try {
    const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (saved && Date.now() - saved.at < CACHE_MS) {
      memoryCache = saved;
      return saved.data;
    }
  } catch {
    // sin acceso al almacenamiento: se pide de nuevo
  }
  return null;
}

function writeCache(data) {
  memoryCache = { at: Date.now(), data };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
  } catch {
    // no pasa nada si no se puede guardar
  }
}

export function fetchHomePromotions() {
  if (!pending) {
    pending = api
      .get("/promotions/home")
      .then(({ data }) => {
        writeCache(data);
        return data;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

const dayMonth = (date) =>
  new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

/** "Del 1/11 al 30/11" */
export function promoDateRange(promo) {
  return `Del ${dayMonth(promo.startDate)} al ${dayMonth(promo.endDate)}`;
}

/** Adónde lleva el botón de una promo: a sus productos o a consultar por WhatsApp. */
export function promoAction(promo, waNumber) {
  const category = promo.categories?.[0];
  if (category) return { to: `/catalogo?category=${category._id}`, label: "Ver productos", Icon: Tag };
  return {
    href: `https://wa.me/${waNumber}?text=${encodeURIComponent(`¡Hola! Quiero consultar por la promo "${promo.title}"`)}`,
    label: "Consultar",
    Icon: MessageCircle
  };
}
