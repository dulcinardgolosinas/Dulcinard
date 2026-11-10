import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cldUrl } from "../../lib/cloudinary";
import { fetchHomePromotions } from "../../lib/promotions";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { PromoInfo, DiscountBadge } from "./PromoInfo";

const SEEN_KEY = "promo-popup-visto";
const OPEN_DELAY_MS = 900;

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // sin almacenamiento: puede volver a aparecer, no es grave
  }
}

// Cartel con las promociones vigentes que se abre al entrar a la tienda (una
// vez por visita). Se apaga desde el panel: Promociones → "Cartel al entrar".
export function PromoPopup() {
  const config = useSiteConfigStore((s) => s.config);
  const enabled = config ? config.promoPopupEnabled !== false : false;
  const [promos, setPromos] = useState([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || alreadySeen()) return;
    let active = true;
    let timer;
    fetchHomePromotions()
      .then((data) => {
        const list = data.filter((p) => p.showInPopup !== false);
        if (!active || !list.length) return;
        setPromos(list);
        timer = setTimeout(() => active && setOpen(true), OPEN_DELAY_MS);
      })
      .catch(() => {});
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled]);

  function close() {
    markSeen();
    setOpen(false);
  }

  function goToPromotions() {
    close();
    setTimeout(() => document.getElementById("promociones")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % promos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + promos.length) % promos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, promos.length]);

  const promo = promos[index];
  const many = promos.length > 1;

  return (
    <AnimatePresence>
      {open && promo && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-popup-title"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            // Nunca más alto que la pantalla visible (en el iPhone, sin las barras de Safari):
            // la X y los botones quedan fijos y solo se desplaza el contenido del medio.
            className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl supports-[height:100dvh]:max-h-[calc(100dvh-1.5rem)]"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={promo._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="relative aspect-[4/3] max-h-[40vh] w-full bg-gradient-to-br from-brand-600 to-brand-950 supports-[height:100dvh]:max-h-[40dvh]">
                  {promo.banner?.url && (
                    <img src={cldUrl(promo.banner.url, { width: 900 })} alt={promo.title} className="h-full w-full object-cover" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-600 shadow">
                    Promoción
                  </span>
                  <DiscountBadge percent={promo.discountPercent} className="absolute bottom-3 left-3 text-base" />
                </div>

                <div className="p-5 pb-3 sm:p-6 sm:pb-4">
                  <h2 id="promo-popup-title" className="font-display text-xl sm:text-2xl font-bold leading-tight text-ink-900">
                    {promo.title}
                  </h2>
                  {promo.description && <p className="mt-2 whitespace-pre-line text-sm text-ink-600">{promo.description}</p>}
                  <div className="mt-4">
                    <PromoInfo promo={promo} size="lg" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {many && (
              <div className="flex items-center justify-between px-5 pb-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + promos.length) % promos.length)}
                  aria-label="Promoción anterior"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-700 hover:border-brand-300"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-1.5">
                  {promos.map((p, i) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Ver promoción ${i + 1} de ${promos.length}`}
                      className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-brand-600" : "w-2 bg-ink-200"}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % promos.length)}
                  aria-label="Promoción siguiente"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-700 hover:border-brand-300"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            </div>

            <div className="flex shrink-0 flex-col gap-1 border-t border-ink-100 p-4 sm:flex-row sm:gap-2 sm:p-5">
              <button
                type="button"
                onClick={goToPromotions}
                className="flex-1 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              >
                {many ? `Ver las ${promos.length} promociones` : "Ver promociones"}
              </button>
              <button type="button" onClick={close} className="rounded-full px-5 py-3 text-sm font-semibold text-ink-600 hover:bg-ink-100">
                Ahora no
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
