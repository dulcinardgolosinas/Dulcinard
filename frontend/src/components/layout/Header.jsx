import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, ShoppingCart, UserRound } from "lucide-react";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { getCategories } from "../../lib/categories";
import { scrollToProducts } from "../../lib/navigation";

const navLinks = [
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

function SearchForm({ transparent, autoFocus = false, onDone, className = "" }) {
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
      <Search
        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${transparent ? "text-white/80" : "text-ink-400"}`}
        strokeWidth={2}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className={`h-10 w-full rounded-full border pl-9 pr-3 text-sm outline-none transition-colors ${
          transparent
            ? "border-white/30 bg-white/15 text-white placeholder:text-white/70 backdrop-blur-sm focus:bg-white focus:text-ink-900 focus:placeholder:text-ink-400"
            : "border-ink-200 bg-ink-50 text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
        }`}
      />
    </form>
  );
}

function CartButton({ transparent }) {
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);
  return (
    <button
      type="button"
      onClick={openCart}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
        transparent ? "bg-white/15 text-white backdrop-blur-sm hover:bg-white/25" : "bg-brand-600 text-white hover:bg-brand-700"
      }`}
      aria-label={count ? `Ver carrito (${count} productos)` : "Ver carrito"}
    >
      <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

// "Productos": en la página principal baja hasta los productos; en otra página
// lleva al catálogo. Al pasar el mouse muestra las categorías.
function ProductsMenu({ transparent, categories, onProducts }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onProducts();
          }}
          className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            transparent ? "bg-white text-brand-600 hover:bg-white/90" : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          Productos
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Ver categorías"
          className={`ml-0.5 rounded-full p-1.5 ${transparent ? "text-white hover:bg-white/15" : "text-ink-600 hover:bg-ink-100"}`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 z-50 w-[28rem] rounded-2xl border border-ink-100 bg-white p-3 shadow-card"
          >
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-ink-400">Categorías</p>
            <div className="grid grid-cols-2 gap-1">
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/catalogo?category=${c._id}`}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <Link
              to="/catalogo"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-brand-50 px-3 py-2 text-center text-sm font-semibold text-brand-600 hover:bg-brand-100"
            >
              Ver todos los productos
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ categories, onProducts, onClose, onPromotions }) {
  const { isAuthenticated } = useAuthStore();
  return (
    <>
      <motion.button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-0 z-40 bg-ink-950/40 lg:hidden"
      />
      {/* El menú se despliega desde el marcador (arriba a la izquierda). */}
      <motion.div
        initial={{ clipPath: "inset(0 100% 100% 0 round 20px)" }}
        animate={{ clipPath: "inset(0 0% 0% 0 round 20px)" }}
        exit={{ clipPath: "inset(0 100% 100% 0 round 20px)" }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-3 top-3 z-50 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[20px] bg-white p-4 pt-28 shadow-2xl lg:hidden"
      >
        <SearchForm onDone={onClose} />

        <button
          type="button"
          onClick={onProducts}
          className="mt-4 w-full rounded-2xl bg-brand-600 px-4 py-3 text-left text-base font-bold text-white"
        >
          Productos
        </button>
        {categories.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/catalogo?category=${c._id}`}
                onClick={onClose}
                className="rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-3 border-t border-ink-100 pt-3">
          <Link to="/" onClick={onClose} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50">
            Inicio
          </Link>
          <button
            type="button"
            onClick={onPromotions}
            className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink-800 hover:bg-ink-50"
          >
            Promociones
          </button>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={onClose} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50">
              {l.label}
            </Link>
          ))}
          <Link
            to={isAuthenticated ? "/perfil" : "/login"}
            onClick={onClose}
            className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
          >
            {isAuthenticated ? "Mi cuenta" : "Ingresar"}
          </Link>
        </div>
      </motion.div>
    </>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const config = useSiteConfigStore((s) => s.config);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const categories = useCategories();

  const isHome = location.pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // El menú se cierra al cambiar de página o con Escape.
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Header transparente sobre el carrusel, solo en la página principal sin scrollear.
  const transparent = isHome && !scrolled && !menuOpen;
  const expanded = isHome && !scrolled;

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

  // En la compu el marcador lleva al inicio; en el celular abre el menú.
  function onBookmarkClick() {
    if (window.matchMedia("(min-width: 1024px)").matches) navigate("/");
    else setMenuOpen((v) => !v);
  }

  return (
    <>
      <header
        className={`inset-x-0 top-0 z-50 transition-colors duration-300 ${
          isHome ? "fixed" : "sticky border-b border-ink-100 bg-white/95 backdrop-blur"
        } ${transparent ? "bg-transparent" : isHome ? "border-b border-ink-100 bg-white/95 backdrop-blur" : ""}`}
      >
        <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6 lg:h-[76px]">
          {/* Marcador: cuelga desde arriba y sobresale por debajo de la barra. */}
          <button
            type="button"
            onClick={onBookmarkClick}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            style={{ clipPath: BOOKMARK_CLIP }}
            className={`absolute left-4 top-0 z-[60] flex flex-col items-center justify-start bg-brand-600 px-2 pb-5 pt-2 shadow-lg transition-[height,width] duration-300 ease-out md:left-6 ${
              expanded ? "h-[124px] w-[100px] lg:h-[168px] lg:w-[136px]" : "h-[96px] w-[92px] lg:h-[108px] lg:w-[112px]"
            }`}
          >
            {config?.logo?.url ? (
              // El logo es rojo: sobre el marcador rojo se muestra en blanco.
              <img src={config.logo.url} alt={config.brandName || "Dulcinard"} className="h-full w-full object-contain brightness-0 invert" />
            ) : (
              <span className="mt-4 font-display text-lg font-black leading-none text-white">DULCINARD</span>
            )}
            <ChevronDown
              className={`absolute bottom-3 h-4 w-4 text-white/90 transition-transform lg:hidden ${menuOpen ? "rotate-180" : ""}`}
              strokeWidth={2.5}
            />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3 pl-[104px] md:pl-[108px] lg:pl-[156px]">
            <nav className="hidden items-center gap-5 lg:flex">
              <ProductsMenu transparent={transparent} categories={categories} onProducts={goToProducts} />
              <button
                type="button"
                onClick={goToPromotions}
                className={`text-sm font-semibold transition-colors ${transparent ? "text-white/85 hover:text-white" : "text-ink-600 hover:text-brand-600"}`}
              >
                Promociones
              </button>
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap text-sm font-semibold transition-colors ${
                      transparent
                        ? isActive
                          ? "text-white"
                          : "text-white/75 hover:text-white"
                        : isActive
                          ? "text-brand-600"
                          : "text-ink-600 hover:text-brand-600"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <SearchForm transparent={transparent} className="min-w-0 flex-1 lg:ml-auto lg:max-w-xs" />

            <Link
              to={isAuthenticated ? "/perfil" : "/login"}
              className={`hidden shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors lg:flex ${
                transparent ? "text-white/85 hover:text-white" : "text-ink-600 hover:text-brand-600"
              }`}
            >
              <UserRound className="h-5 w-5" strokeWidth={1.8} />
              {isAuthenticated ? user?.name?.split(" ")[0] : "Ingresar"}
            </Link>

            <CartButton transparent={transparent} />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenu
            categories={categories}
            onProducts={goToProducts}
            onPromotions={goToPromotions}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
