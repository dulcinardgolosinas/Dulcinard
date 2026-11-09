import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutGrid, Search, ShoppingCart, Tag, UserRound } from "lucide-react";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { getCategories } from "../../lib/categories";
import { scrollToProducts } from "../../lib/navigation";
import { cldUrl } from "../../lib/cloudinary";

const infoLinks = [
  { to: "/quienes-somos", label: "Quiénes somos" },
  { to: "/envios", label: "Envíos y zonas" },
  { to: "/contacto", label: "Contacto" }
];

// Forma de cinta de marcador de libro: rectángulo con un corte en V abajo.
const BOOKMARK_CLIP = "polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)";

function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let active = true;
    getCategories()
      .then((data) => active && setCategories(data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return categories;
}

// Al bajar, la franja blanca se achica (el logo queda visible) y al subir vuelve a su tamaño.
function useStripHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) setHidden(false);
        else if (y - lastY > 8) setHidden(true);
        else if (lastY - y > 8) setHidden(false);
        lastY = y;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return hidden;
}

/** Logo de la franja blanca (o el principal, si no hay uno cargado). */
function SecondaryLogo({ config, className }) {
  const url = config?.secondaryLogo?.url || config?.logo?.url;
  if (!url) return <span className="font-display text-2xl font-black text-brand-600">DULCINARD</span>;
  return <img src={cldUrl(url, { height: 160, trim: true })} alt={config?.brandName || "Dulcinard"} className={`w-auto object-contain ${className}`} />;
}

function SearchForm({ autoFocus = false, onDone, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("q") || "");

  function submit(e) {
    e.preventDefault();
    const text = q.trim();
    navigate(text ? `/catalogo?q=${encodeURIComponent(text)}` : "/catalogo");
    onDone?.();
  }

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="h-11 w-full rounded-full border border-ink-200 bg-ink-50 pl-4 pr-12 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
      >
        <Search className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </form>
  );
}

function CartButton({ onOpen }) {
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);
  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        openCart();
      }}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
      aria-label={count ? `Ver carrito (${count} productos)` : "Ver carrito"}
    >
      <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-600 shadow">
          {count}
        </span>
      )}
    </button>
  );
}

// Menú que se despliega desde la solapa: arriba el logo de la franja blanca,
// después el buscador, los productos por categoría y el resto de las páginas.
function SolapaMenu({ config, categories, onProducts, onPromotions, onClose }) {
  const { isAuthenticated } = useAuthStore();
  const ref = useRef(null);
  const [maxHeight, setMaxHeight] = useState(undefined);

  // Alto máximo = lo que queda de pantalla debajo del header (en el celular,
  // también descuenta la barra de abajo). Si no entra todo, se scrollea adentro.
  useLayoutEffect(() => {
    function measure() {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const bottomBar = window.innerWidth < 768 ? 76 : 16;
      setMaxHeight(Math.max(240, window.innerHeight - top - bottomBar));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ maxHeight }}
      initial={{ clipPath: "inset(0 100% 100% 0 round 0 0 20px 20px)" }}
      animate={{ clipPath: "inset(0 0% 0% 0 round 0 0 20px 20px)" }}
      exit={{ clipPath: "inset(0 100% 100% 0 round 0 0 20px 20px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto w-full overflow-y-auto overscroll-contain rounded-b-[20px] bg-white px-4 pb-4 pt-9 shadow-2xl sm:w-[26rem]"
    >
      <Link to="/" onClick={onClose} className="flex justify-center">
        <SecondaryLogo config={config} className="h-12" />
      </Link>

      <SearchForm onDone={onClose} className="mt-3" />

      <button
        type="button"
        onClick={onProducts}
        className="mt-3 flex w-full items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-left text-base font-bold text-white"
      >
        <LayoutGrid className="h-5 w-5" /> Productos
      </button>
      {categories.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {categories.map((c) => (
            <Link key={c._id} to={`/catalogo?category=${c._id}`} onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-ink-100 pt-3">
        <button
          type="button"
          onClick={onPromotions}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-brand-600 hover:bg-brand-50"
        >
          <Tag className="h-4 w-4" /> Ofertas y promociones
        </button>
        <Link to="/" onClick={onClose} className="block rounded-xl px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50">
          Inicio
        </Link>
        {infoLinks.map((l) => (
          <Link key={l.to} to={l.to} onClick={onClose} className="block rounded-xl px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50">
            {l.label}
          </Link>
        ))}
        <Link to={isAuthenticated ? "/perfil" : "/login"} onClick={onClose} className="block rounded-xl px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50">
          {isAuthenticated ? "Mi cuenta" : "Ingresar"}
        </Link>
      </div>
    </motion.div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = useSiteConfigStore((s) => s.config);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const categories = useCategories();
  const stripHidden = useStripHidden();

  const isHome = location.pathname === "/";
  const compact = stripHidden && !menuOpen;

  // El menú se cierra al cambiar de página, con Escape o al tocar afuera.
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function goToSection(id, fallback) {
    setMenuOpen(false);
    if (isHome) {
      if (id === "productos") scrollToProducts();
      else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(fallback);
    }
  }
  const goToProducts = () => goToSection("productos", "/catalogo");
  const goToPromotions = () => goToSection("promociones", "/#promociones");

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[52] bg-ink-950/40"
          />
        )}
      </AnimatePresence>

      {/* Con el menú abierto, el header queda por encima del botón de WhatsApp. */}
      <header className={`sticky top-0 bg-white shadow-[0_2px_12px_-6px_rgba(32,28,27,0.25)] ${menuOpen ? "z-[55]" : "z-50"}`}>
        <div className="relative">
          {/* Solapa con el logo principal: cuelga desde arriba y sobresale por debajo.
              Al tocarla se despliega el menú. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] mx-auto max-w-7xl px-4 md:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              style={{ clipPath: BOOKMARK_CLIP }}
              className={`pointer-events-auto relative flex flex-col items-center justify-center bg-brand-600 px-1.5 pb-7 pt-2 shadow-lg transition-[height,width] duration-300 ease-out ${
                compact
                  ? "h-[112px] w-[88px] md:h-[160px] md:w-[96px] lg:h-[176px] lg:w-[124px]"
                  : "h-[124px] w-[88px] md:h-[172px] md:w-[96px] lg:h-[196px] lg:w-[124px]"
              }`}
            >
              {config?.logo?.url ? (
                // El logo es rojo: sobre la solapa roja se muestra en blanco.
                // Se recorta el margen vacío de la imagen para que el logo ocupe toda la solapa.
                <img
                  src={cldUrl(config.logo.url, { width: 320, trim: true })}
                  alt={config.brandName || "Dulcinard"}
                  className="h-full w-full object-contain brightness-0 invert"
                />
              ) : (
                <span className="mt-3 font-display text-base font-black leading-none text-white">DULCINARD</span>
              )}
              <ChevronDown className={`absolute bottom-3 h-4 w-4 text-white/90 transition-transform ${menuOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
            </button>
          </div>

          {/* a) Franja blanca con el logo de la franja, centrado. Siempre visible: al bajar se achica. */}
          <div>
            {/* Tres columnas: a la izquierda el lugar de la solapa, el logo al medio y los links a la derecha. */}
            <div
              className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 transition-[height] duration-300 md:px-6 ${
                compact ? "h-12 lg:h-14" : "h-14 lg:h-[72px]"
              }`}
            >
              <div aria-hidden="true" />
              <Link to="/" aria-label="Ir al inicio">
                <SecondaryLogo config={config} className={`transition-[height] duration-300 ${compact ? "h-8 lg:h-10" : "h-10 lg:h-14"}`} />
              </Link>
              <nav className="hidden items-center justify-self-end gap-5 lg:flex">
                {infoLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? "text-brand-600" : "text-ink-600 hover:text-brand-600"}`}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          {/* b) Categorías, buscador grande y carrito. */}
          <div className="border-t border-ink-100">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 md:px-6 lg:h-[60px] lg:gap-3">
              <div className={`w-[92px] shrink-0 md:w-[104px] lg:w-[132px]`} aria-hidden="true" />
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-ink-200 px-4 text-sm font-bold text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-600 lg:flex"
              >
                <LayoutGrid className="h-4 w-4" /> Categorías
              </button>
              <SearchForm className="min-w-0 flex-1" />
              <Link
                to={isAuthenticated ? "/perfil" : "/login"}
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-600 transition-colors hover:text-brand-600 lg:flex"
              >
                <UserRound className="h-5 w-5" strokeWidth={1.8} />
                {isAuthenticated ? user?.name?.split(" ")[0] : "Ingresar"}
              </Link>
              <CartButton onOpen={() => setMenuOpen(false)} />
            </div>
          </div>

          {/* c) Barra del color de la marca con las categorías y las ofertas (desde tablet). */}
          <div className="hidden bg-brand-600 md:block">
            <div className="mx-auto flex h-11 max-w-7xl items-center px-4 md:px-6">
              <div className={`w-[92px] shrink-0 md:w-[104px] lg:w-[132px]`} aria-hidden="true" />
              <nav aria-label="Categorías" className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={goToPromotions}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold text-brand-600 hover:bg-brand-50"
                >
                  <Tag className="h-3.5 w-3.5" /> Ofertas
                </button>
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    to={`/catalogo?category=${c._id}`}
                    className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* El menú se abre justo debajo de la solapa (alineado con el contenido, no con el borde de la pantalla). */}
          <div className="pointer-events-none absolute inset-x-0 top-full z-40">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
          <AnimatePresence>
            {menuOpen && (
              <SolapaMenu
                config={config}
                categories={categories}
                onProducts={goToProducts}
                onPromotions={goToPromotions}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
