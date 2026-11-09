import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { cldSrcSet, cldUrl } from "../../lib/cloudinary";
import { slideHref } from "../../lib/navigation";
import { HERO_RATIO } from "../../lib/heroMedia";
import { useSiteConfigStore } from "../../store/siteConfigStore";

const FALLBACK_VIDEO_URL = "https://res.cloudinary.com/nu4m5rh8/video/upload/v1793559589/video_golosinas_de71fs.mp4";
const PHOTO_MS = 6000;
const DEFAULT_VIDEO_MAX_SECONDS = 20;
const SLIDE_WIDTHS = [640, 960, 1280, 1600, 2000];
const SWIPE_DISTANCE = 60;

// Los slides del carrusel se recuerdan en el navegador: en las visitas
// siguientes aparecen al instante y después se actualizan con los del servidor.
const SLIDES_KEY = "carrusel-inicio";
function readSavedSlides() {
  try {
    const saved = JSON.parse(localStorage.getItem(SLIDES_KEY) || "null");
    return Array.isArray(saved) ? saved : null;
  } catch {
    return null;
  }
}
function saveSlides(slides) {
  try {
    localStorage.setItem(SLIDES_KEY, JSON.stringify(slides));
  } catch {
    // sin almacenamiento: se piden de nuevo la próxima vez
  }
}

const isVideo = (slide) => slide?.mediaType === "video" && slide.video?.url;

/**
 * Foto o video de un slide, entero (sin recortar). Detrás va la misma imagen
 * borrosa para que, si sobra lugar a los costados, no queden franjas vacías.
 */
function SlideMedia({ slide, eager, loop, onVideoEnd }) {
  const backdrop = (
    <img
      src={cldUrl(slide.image?.url, { width: 64 })}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
    />
  );
  if (isVideo(slide)) {
    return (
      <>
        {backdrop}
        <video
          key={slide.video.url}
          src={slide.video.url}
          poster={cldUrl(slide.image?.url, { width: 1280 })}
          autoPlay
          muted
          loop={loop}
          playsInline
          preload="auto"
          onEnded={onVideoEnd}
          className="relative h-full w-full object-cover"
        />
      </>
    );
  }
  return (
    <>
      {backdrop}
      <img
        src={cldUrl(slide.image.url, { width: 1600 })}
        srcSet={cldSrcSet(slide.image.url, SLIDE_WIDTHS)}
        sizes="100vw"
        alt={slide.title || "Dulcinard"}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        className="relative h-full w-full select-none object-cover"
      />
    </>
  );
}

// Carrusel de la página principal: solo fotos y videos, sin texto encima.
// Cada slide lleva a su link (producto, categoría o catálogo).
export function HeroCarousel() {
  const config = useSiteConfigStore((s) => s.config);
  const reduceMotion = useReducedMotion();
  const [slides, setSlides] = useState(() => readSavedSlides() || []);
  const [loaded, setLoaded] = useState(() => readSavedSlides() !== null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const draggedRef = useRef(false);

  useEffect(() => {
    let active = true;
    api
      .get("/home-hero-images")
      .then(({ data }) => {
        saveSlides(data);
        if (active) setSlides(data);
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  const count = slides.length;
  // Si cambió la cantidad de slides (ej: se borró uno), se vuelve al primero.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);
  const go = useCallback((step) => setIndex((i) => (i + step + count) % count), [count]);

  const slide = slides[index];
  const next = count > 1 ? slides[(index + 1) % count] : null;
  const videoMaxMs = (config?.heroVideoMaxSeconds || DEFAULT_VIDEO_MAX_SECONDS) * 1000;

  // Avance automático: las fotos cada 6 s; los videos cuando terminan o al
  // llegar al máximo configurado en el panel. Se pausa con el mouse encima, con
  // la pestaña oculta o si la persona pidió menos animaciones.
  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = setTimeout(() => !document.hidden && go(1), isVideo(slide) ? videoMaxMs : PHOTO_MS);
    return () => clearTimeout(timer);
  }, [count, index, paused, reduceMotion, go, slide, videoMaxMs]);

  function handleVideoEnd() {
    if (count > 1 && !paused) go(1);
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-brand-950"
      // Todos los slides del mismo tamaño: la medida del carrusel (1920 x 800).
      style={{ aspectRatio: HERO_RATIO }}
      aria-roledescription="carrusel"
      aria-label="Carrusel de la página principal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slide ? (
        <motion.div
          className="absolute inset-0 touch-pan-y"
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragStart={() => (draggedRef.current = true)}
          onDragEnd={(_, { offset, velocity }) => {
            // El "click" que llega justo después del arrastre se ignora; después se libera.
            setTimeout(() => (draggedRef.current = false), 0);
            if (offset.x < -SWIPE_DISTANCE || velocity.x < -500) go(1);
            else if (offset.x > SWIPE_DISTANCE || velocity.x > 500) go(-1);
          }}
          // Deslizar con el dedo no tiene que abrir el link del slide.
          onClickCapture={(e) => {
            if (draggedRef.current) e.preventDefault();
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={slide._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Link to={slideHref(slide)} aria-label={slide.title || `Ver slide ${index + 1}`} className="block h-full w-full" draggable={false}>
                <SlideMedia slide={slide} eager={index === 0} loop={count === 1} onVideoEnd={handleVideoEnd} />
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* La foto siguiente (o la miniatura del video) se va cargando de fondo. */}
          {next?.image?.url && (
            <img
              src={cldUrl(next.image.url, { width: 1600 })}
              srcSet={isVideo(next) ? undefined : cldSrcSet(next.image.url, SLIDE_WIDTHS)}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="pointer-events-none absolute h-px w-px opacity-0"
            />
          )}
        </motion.div>
      ) : loaded ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={FALLBACK_VIDEO_URL} autoPlay muted loop playsInline preload="metadata" />
      ) : null}

      {/* Sombra suave abajo para que se vean los puntitos. */}
      {count > 1 && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950/40 to-transparent" />}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/40 text-white shadow-lg backdrop-blur-sm transition hover:bg-ink-950/60 md:left-3 md:h-12 md:w-12"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/40 text-white shadow-lg backdrop-blur-sm transition hover:bg-ink-950/60 md:right-3 md:h-12 md:w-12"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver slide ${i + 1} de ${count}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
