import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Tag } from "lucide-react";
import { api } from "../../lib/api";
import { cldUrl } from "../../lib/cloudinary";
import { toWhatsappNumber } from "../../lib/whatsapp";
import { useSiteConfigStore } from "../../store/siteConfigStore";

// Las promos se guardan un rato en el navegador: al volver a la página
// principal se muestran al instante, sin esperar al servidor.
const CACHE_KEY = "home-promotions";
const CACHE_MS = 5 * 60 * 1000;
let memoryCache = null;

function readCache() {
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

const formatDay = (date) => new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "numeric" });

function PromoSkeleton() {
  return (
    <div className="w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl border border-ink-100 bg-white sm:w-auto" aria-hidden="true">
      <div className="aspect-[16/9] animate-pulse bg-ink-100" />
      <div className="space-y-2 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
        <div className="mt-4 h-9 w-32 animate-pulse rounded-full bg-ink-100" />
      </div>
    </div>
  );
}

function PromoCard({ promo, waNumber }) {
  const category = promo.categories?.[0];
  const cta = category
    ? { as: Link, props: { to: `/catalogo?category=${category._id}` }, label: "Ver productos", Icon: Tag }
    : {
        as: "a",
        props: {
          href: `https://wa.me/${waNumber}?text=${encodeURIComponent(`¡Hola! Quiero consultar por la promo "${promo.title}"`)}`,
          target: "_blank",
          rel: "noopener noreferrer"
        },
        label: "Consultar",
        Icon: MessageCircle
      };
  const Wrapper = cta.as;

  return (
    <Wrapper
      {...cta.props}
      className="group flex w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_20px_45px_-25px_rgba(32,28,27,0.3)] transition-shadow hover:shadow-[0_25px_50px_-20px_rgba(184,24,48,0.35)] sm:w-auto"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-brand-950">
        {promo.banner?.url && (
          <img
            src={cldUrl(promo.banner.url, { width: 640 })}
            srcSet={`${cldUrl(promo.banner.url, { width: 400 })} 400w, ${cldUrl(promo.banner.url, { width: 640 })} 640w, ${cldUrl(promo.banner.url, { width: 960 })} 960w`}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 82vw"
            alt={promo.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {promo.discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-sm font-extrabold text-white shadow">
            {promo.discountPercent}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-lg font-bold leading-snug text-ink-900">{promo.title}</p>
        {promo.description && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{promo.description}</p>}
        <p className="mt-2 text-xs text-ink-400">
          {category ? `En ${promo.categories.map((c) => c.name).join(", ")} · ` : ""}Hasta el {formatDay(promo.endDate)}
        </p>
        <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-700">
          <cta.Icon className="h-4 w-4" strokeWidth={2} />
          {cta.label}
        </span>
      </div>
    </Wrapper>
  );
}

export function HomePromotions() {
  const config = useSiteConfigStore((s) => s.config);
  const [promotions, setPromotions] = useState(() => readCache());

  useEffect(() => {
    let active = true;
    api
      .get("/promotions/home")
      .then(({ data }) => {
        writeCache(data);
        if (active) setPromotions(data);
      })
      .catch(() => active && setPromotions((prev) => prev || []));
    return () => {
      active = false;
    };
  }, []);

  if (promotions && promotions.length === 0) return null;
  const waNumber = toWhatsappNumber(config?.whatsappNumber) || "5493814091213";

  return (
    <section id="promociones" className="scroll-mt-28 py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
          <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-600 to-brand-600" />
          No te lo pierdas
        </span>
        <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">Promociones</h2>

        {/* Celular: tarjetas que se deslizan de costado. Desde tablet: grilla. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="scrollbar-thin -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
        >
          {promotions
            ? promotions.map((p) => <PromoCard key={p._id} promo={p} waNumber={waNumber} />)
            : Array.from({ length: 4 }, (_, i) => <PromoSkeleton key={i} />)}
        </motion.div>
      </div>
    </section>
  );
}
