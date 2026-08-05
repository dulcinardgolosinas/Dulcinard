import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";

const navLinks = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/quienes-somos", label: "Quiénes somos" },
  { to: "/envios", label: "Envíos y zonas" },
  { to: "/contacto", label: "Contacto" }
];

function BranchPicker() {
  const config = useSiteConfigStore((s) => s.config);
  const [open, setOpen] = useState(false);
  const branches = config?.branches || [];
  if (!branches.length) return null;

  return (
    <div className="relative hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-brand-600"
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
            <div key={b._id} className="border-b border-ink-50 px-2 py-2.5 last:border-none">
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
  const config = useSiteConfigStore((s) => s.config);
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);
  const { isAuthenticated, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          {config?.logo?.url ? (
            <img src={config.logo.url} alt={config.brandName} className="h-10 w-auto" />
          ) : (
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl font-bold tracking-tight text-brand-600">DULCI-NARD</span>
              <span className="text-[11px] font-semibold tracking-[0.25em] text-ink-400">TUCUMÁN</span>
            </div>
          )}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${isActive ? "text-brand-600" : "text-ink-600 hover:text-brand-600"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <BranchPicker />

          <Link
            to={isAuthenticated ? "/perfil" : "/login"}
            className="hidden items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600 md:flex"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 20c1.5-3.6 4.5-5.4 7-5.4S18.5 16.4 20 20" />
            </svg>
            {isAuthenticated ? user?.name?.split(" ")[0] : "Ingresar"}
          </Link>

          <button
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white transition-colors hover:bg-brand-600"
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
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-ink-100 bg-white px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block border-b border-ink-50 py-3 text-sm font-semibold text-ink-700 last:border-none"
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to={isAuthenticated ? "/perfil" : "/login"}
            onClick={() => setMobileOpen(false)}
            className="block py-3 text-sm font-semibold text-brand-600"
          >
            {isAuthenticated ? "Mi cuenta" : "Ingresar / Registrarme"}
          </Link>
        </nav>
      )}
    </header>
  );
}
