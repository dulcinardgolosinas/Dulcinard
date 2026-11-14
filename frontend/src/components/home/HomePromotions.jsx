import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cldUrl } from "../../lib/cloudinary";
import { toWhatsappNumber } from "../../lib/whatsapp";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { fetchHomePromotions, promoBuyLink, promoWhatsappHref, readCachedPromotions } from "../../lib/promotions";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { PromoInfo, PromoBadges } from "./PromoInfo";
import { PROMO_KINDS, promoKind } from "../../lib/promotionTypes";

function PromoSkeleton() {
  return (
    <div className="w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl border border-ink-100 bg-white sm:w-auto" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-ink-100" />
      <div className="space-y-2 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
        <div className="h-7 w-1/3 animate-pulse rounded bg-ink-100" />
        <div className="mt-4 h-9 w-32 animate-pulse rounded-full bg-ink-100" />
      </div>
    </div>
  );
}

function PromoCard({ promo, waNumber }) {
  return (
    <article className="flex w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_20px_45px_-25px_rgba(32,28,27,0.3)] sm:w-auto">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-600 to-brand-950">
        {promo.banner?.url && (
          <img
            src={cldUrl(promo.banner.url, { width: 640 })}
            srcSet={`${cldUrl(promo.banner.url, { width: 400 })} 400w, ${cldUrl(promo.banner.url, { width: 640 })} 640w, ${cldUrl(promo.banner.url, { width: 960 })} 960w`}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 82vw"
            alt={promo.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
        <PromoBadges promo={promo} className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-ink-900">{promo.title}</h3>
        {promo.description && <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{promo.description}</p>}
        {promo.categories?.length > 0 && (
          <p className="mt-1 text-xs text-ink-500">En {promo.categories.map((c) => c.name).join(", ")}</p>
        )}
        {promo.products?.length > 0 && (
          <p className="mt-1 text-xs text-ink-500">Incluye: {promo.products.map((p) => p.name).join(" · ")}</p>
        )}
        <div className="mt-auto pt-3">
          <PromoInfo promo={promo} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={promoBuyLink(promo)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2} />
              Comprar
            </Link>
            <a
              href={promoWhatsappHref(promo, waNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Consultar
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HomePromotions() {
  const config = useSiteConfigStore((s) => s.config);
  const [promotions, setPromotions] = useState(() => readCachedPromotions());
  const [kind, setKind] = useState(""); // "special" = fechas especiales, "general" = comunes, "" = todas

  useEffect(() => {
    let active = true;
    fetchHomePromotions()
      .then((data) => active && setPromotions(data))
      .catch(() => active && setPromotions((prev) => prev || []));
    return () => {
      active = false;
    };
  }, []);

  if (promotions && promotions.length === 0) return null;
  const waNumber = toWhatsappNumber(config?.whatsappNumber) || "5493814091213";
  // El filtro solo aparece si hay promos de fechas especiales y comunes a la vez.
  const kinds = promotions ? PROMO_KINDS.filter((k) => promotions.some((p) => promoKind(p) === k.value)) : [];
  const shown = promotions && kind ? promotions.filter((p) => promoKind(p) === kind) : promotions;
  const chip = (active) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
      active ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
    }`;

  return (
    <section id="promociones" className="scroll-mt-28 py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
          <span className="h-1.5 w-6 rounded-full bg-brand-600" />
          No te lo pierdas
        </span>
        <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">Promociones</h2>
        {kinds.length > 1 && (
          <div role="group" aria-label="Filtrar promociones" className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" onClick={() => setKind("")} aria-pressed={!kind} className={chip(!kind)}>
              Todas
            </button>
            {kinds.map((k) => (
              <button key={k.value} type="button" onClick={() => setKind(k.value)} aria-pressed={kind === k.value} className={chip(kind === k.value)}>
                {k.label}
              </button>
            ))}
          </div>
        )}

        {/* Celular: tarjetas que se deslizan de costado. Desde tablet: grilla. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="scrollbar-thin -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4"
        >
          {shown
            ? shown.map((p) => <PromoCard key={p._id} promo={p} waNumber={waNumber} />)
            : Array.from({ length: 4 }, (_, i) => <PromoSkeleton key={i} />)}
        </motion.div>
      </div>
    </section>
  );
}
