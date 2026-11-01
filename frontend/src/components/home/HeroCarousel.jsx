import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { api } from "../../lib/api";
import { cldSrcSet, cldUrl } from "../../lib/cloudinary";
import { formatCurrency } from "../../lib/format";
import { fadeUp } from "../../lib/motion";
import { useSiteContent } from "../../lib/siteContent";
import { scrollToProducts, slideHref } from "../../lib/navigation";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { Button } from "../ui/Button";

const HERO_VIDEO_URL = "https://res.cloudinary.com/nu4m5rh8/video/upload/v1793559589/video_golosinas_de71fs.mp4";
const AUTOPLAY_MS = 6000;
const SLIDE_WIDTHS = [640, 960, 1280, 1600, 2000];
const SWIPE_DISTANCE = 60;

export function HeroCarousel() {
  const config = useSiteConfigStore((s) => s.config);
  const content = useSiteContent();
  const reduceMotion = useReducedMotion();
  const [slides, setSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get("/home-hero-images")
      .then(({ data }) => active && setSlides(data))
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  const count = slides.length;
  const go = useCallback((step) => setIndex((i) => (i + step + count) % count), [count]);

  // Autoplay: se pausa con el mouse encima, con la pestaña oculta o si la
  // persona pidió menos animaciones. Cambiar de foto a mano reinicia el tiempo.
  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = setTimeout(() => {
      if (!document.hidden) go(1);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [count, index, paused, reduceMotion, go]);

  const slide = slides[index];
  const next = count > 1 ? slides[(index + 1) % count] : null;
  const showVideo = loaded && count === 0;

  return (
    <section
      className="relative flex min-h-[88vh] items-end overflow-hidden bg-brand-950 text-white md:min-h-[92vh] md:items-center"
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fondo: la foto actual (con swipe en celular) o el video si no hay fotos cargadas. */}
      {slide ? (
        <motion.div
          className="absolute inset-0 touch-pan-y"
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, { offset, velocity }) => {
            if (offset.x < -SWIPE_DISTANCE || velocity.x < -500) go(1);
            else if (offset.x > SWIPE_DISTANCE || velocity.x > 500) go(-1);
          }}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={slide._id}
              src={cldUrl(slide.image.url, { width: 1600 })}
              srcSet={cldSrcSet(slide.image.url, SLIDE_WIDTHS)}
              sizes="100vw"
              alt={slide.title || "Productos Dulcinard"}
              draggable={false}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
          </AnimatePresence>
          {/* La foto siguiente se va cargando de fondo para que el cambio sea instantáneo. */}
          {next && (
            <img
              src={cldUrl(next.image.url, { width: 1600 })}
              srcSet={cldSrcSet(next.image.url, SLIDE_WIDTHS)}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="pointer-events-none absolute h-px w-px opacity-0"
            />
          )}
        </motion.div>
      ) : showVideo ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={HERO_VIDEO_URL} autoPlay muted loop playsInline preload="metadata" />
      ) : null}

      {/* Capas de contraste para que el nombre y los botones siempre se lean. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/35 to-ink-950/90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/75 via-ink-950/20 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-32 pt-44 md:px-6 md:py-32">
        <motion.div initial="hidden" animate="show" className="max-w-3xl">
          <motion.span
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            {content.homeTagline}
          </motion.span>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="mt-5 font-display text-6xl font-black leading-[0.9] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)] sm:text-7xl md:text-8xl lg:text-9xl"
          >
            DULCINARD
          </motion.h1>

          <div className="mt-5 min-h-[3.5rem]">
            <AnimatePresence mode="wait">
              <motion.p
                key={slide?._id || "default"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="max-w-xl text-base text-white/90 md:text-xl"
              >
                {slide?.title ? <strong className="font-semibold text-white">{slide.title}</strong> : content.homeSubtitle}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.div custom={2} variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
            <Link to={slide ? slideHref(slide) : "/catalogo"}>
              <Button variant="accent" size="lg" className="shadow-[0_8px_30px_-8px_rgba(184,24,48,0.6)] transition-transform hover:scale-105">
                <ShoppingBag className="h-5 w-5" strokeWidth={2} />
                {slide?.buttonText || "Comprar"}
              </Button>
            </Link>
            <button
              type="button"
              onClick={scrollToProducts}
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-brand-700"
            >
              Ver productos
            </button>
          </motion.div>

          <motion.div custom={3} variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/75 sm:text-sm">
            <span>Compra mínima {formatCurrency(config?.minPurchaseAmount ?? 100000)}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>Envío {formatCurrency(config?.defaultShippingCost ?? 3500)}</span>
          </motion.div>
        </motion.div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30 md:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30 md:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute inset-x-0 bottom-20 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${count}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
