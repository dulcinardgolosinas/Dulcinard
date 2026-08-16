import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { confirmLogout, toastSuccess } from "../../lib/alerts";

function ViewSiteLink({ className = "" }) {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-fit items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline ${className}`}
    >
      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
      Ver sitio
    </a>
  );
}

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/productos", label: "Productos" },
  { to: "/admin/categorias", label: "Categorías" },
  { to: "/admin/promociones", label: "Promociones" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/usuarios", label: "Usuarios" },
  { to: "/admin/sucursales", label: "Sucursales" },
  { to: "/admin/zonas-envio", label: "Zonas de envío" },
  { to: "/admin/proveedores", label: "Proveedores" },
  { to: "/admin/imagenes-hero", label: "Imágenes de fondo" },
  { to: "/admin/configuracion", label: "Configuración" }
];

function BrandMark({ config }) {
  return config?.logo?.url ? (
    <img src={config.logo.url} alt={config.brandName || "Dulcinard"} className="h-20 w-auto" />
  ) : (
    <div className="flex flex-col leading-none">
      <span className="font-display text-xl font-bold text-brand-600">DULCINARD</span>
      <span className="text-[10px] font-semibold tracking-[0.2em] text-ink-400">PANEL ADMIN</span>
    </div>
  );
}

function NavLinks({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const config = useSiteConfigStore((s) => s.config);
  const fetchConfig = useSiteConfigStore((s) => s.fetchConfig);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function handleLogout() {
    const confirmed = await confirmLogout();
    if (!confirmed) return;
    logout();
    toastSuccess("Cerraste sesión correctamente");
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-100 bg-white lg:flex">
        <div className="border-b border-ink-100 px-5 py-5">
          <Link to="/">
            <BrandMark config={config} />
          </Link>
          <ViewSiteLink className="mt-3" />
        </div>
        <NavLinks />
        <div className="border-t border-ink-100 px-5 py-4">
          <p className="text-sm font-semibold text-ink-800">{user?.name}</p>
          <p className="text-xs text-ink-400">{user?.email}</p>
          <button onClick={handleLogout} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 sm:px-5 sm:py-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700"
            aria-label="Abrir menú del panel"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="font-display text-lg font-bold text-brand-600">Panel Admin</span>
          <ViewSiteLink />
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" />
            <aside className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
                <Link to="/" onClick={() => setMobileOpen(false)}>
                  <BrandMark config={config} />
                </Link>
                <button onClick={() => setMobileOpen(false)} aria-label="Cerrar" className="text-ink-400">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="px-5 pt-4">
                <ViewSiteLink />
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <div className="border-t border-ink-100 px-5 py-4">
                <p className="text-sm font-semibold text-ink-800">{user?.name}</p>
                <p className="text-xs text-ink-400">{user?.email}</p>
                <button onClick={handleLogout} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
                  Cerrar sesión
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="p-4 sm:p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
