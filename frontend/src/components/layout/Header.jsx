import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Store, Users, Truck, MessageCircle, UserRound, ArrowRight } from "lucide-react";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";

const navLinks = [
  { to: "/catalogo", label: "Catálogo", icon: Store },
  { to: "/quienes-somos", label: "Quiénes somos", icon: Users },
  { to: "/envios", label: "Envíos y zonas", icon: Truck },
  { to: "/contacto", label: "Contacto", icon: MessageCircle }
];

function BranchPicker({ transparent }) {
  const config = useSiteConfigStore((s) => s.config);
  const [open, setOpen] = useState(false);
  const branches = config?.branches || [];
  if (!branches.length) return null;

  return (
    <div className="relative hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
          transparent ? "text-white/80 hover:text-white" : "text-ink-500 hover:text-brand-600"
        }`}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        Nuestras sucursales
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-40 w-80 rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
          {branches.map((b) => (
            <div
              key={b._id}
              className="rounded-xl border-b border-ink-50 px-2 py-2.5 transition-colors last:border-none hover:bg-brand-50"
            >
              <p className="text-sm font-semibold text-ink-900">{b.name}</p>
              <p className="text-xs text-ink-500">{b.address}</p>
              <p className="mt-1 text-xs text-ink-400">
                {b.schedule?.weekdays?.label}: {b.schedule?.weekdays?.hours}
              </p>
              <p className="text-xs text-ink-400">
                {b.schedule?.saturday?.label}: {b.schedule?.saturday?.hours}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const config = useSiteConfigStore((s) => s.config);
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

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

  // Header transparente flotando sobre el video del hero, solo en Home y sin scrollear.
  const transparent = isHome && !scrolled;

  return (
    <header
      className={`inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isHome ? "fixed" : "sticky border-b border-ink-100 bg-white/95 backdrop-blur"
      } ${transparent ? "bg-transparent" : isHome ? "border-b border-ink-100 bg-white/95 backdrop-blur" : ""}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          {config?.logo?.url ? (
            <img
              src={config.logo.url}
              alt={config.brandName}
              className="h-12 w-auto transition-all sm:h-14 md:h-24"
            />
          ) : (
            <div className="flex flex-col leading-none">
              <span className={`font-display text-2xl font-bold tracking-tight ${transparent ? "text-white" : "text-brand-600"}`}>
                DULCINARD
              </span>
              <span className={`text-[11px] font-semibold tracking-[0.25em] ${transparent ? "text-white/70" : "text-ink-400"}`}>
                TUCUMÁN
              </span>
            </div>
          )}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${
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

        <div className="flex items-center gap-3">
          <BranchPicker transparent={transparent} />

          <Link
            to={isAuthenticated ? "/perfil" : "/login"}
            className={`hidden items-center gap-1.5 text-sm font-semibold transition-colors md:flex ${
              transparent ? "text-white/85 hover:text-white" : "text-ink-600 hover:text-brand-600"
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 20c1.5-3.6 4.5-5.4 7-5.4S18.5 16.4 20 20" />
            </svg>
            {isAuthenticated ? user?.name?.split(" ")[0] : "Ingresar"}
          </Link>

          <button
            onClick={openCart}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              transparent ? "bg-white/15 text-white backdrop-blur-sm hover:bg-white/25" : "bg-ink-900 text-white hover:bg-brand-600"
            }`}
            aria-label="Ver carrito"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 4h2l1.4 11.2A2 2 0 0 0 8.4 17h8.2a2 2 0 0 0 2-1.7L20 8H6" />
              <circle cx="9" cy="20" r="1.2" fill="currentColor" />
              <circle cx="17" cy="20" r="1.2" fill="currentColor" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-400 text-[11px] font-bold text-ink-900">
                {count}
              </span>
            )}
          </button>

          <button
            className={`flex h-10 w-10 items-center justify-center rounded-full md:hidden ${transparent ? "text-white" : "text-ink-700"}`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-50 overflow-hidden rounded-b-3xl border-t border-white/10 bg-gradient-to-b from-ink-950 via-brand-900 to-brand-800 px-4 pb-5 pt-3 shadow-2xl md:hidden"
          >
            <div className="space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                        isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <link.icon className="h-5 w-5 shrink-0 text-accent-400" strokeWidth={1.8} />
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navLinks.length * 0.05 }}
            >
              <Link
                to={isAuthenticated ? "/perfil" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="mt-3 flex items-center justify-between rounded-2xl bg-gradient-to-r from-accent-400 to-accent-500 px-4 py-3.5 text-sm font-bold text-ink-950 shadow-lg shadow-accent-500/20"
              >
                <span className="flex items-center gap-2">
                  <UserRound className="h-5 w-5" strokeWidth={2} />
                  {isAuthenticated ? "Mi cuenta" : "Ingresar / Registrarme"}
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
