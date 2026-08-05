import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/productos", label: "Productos" },
  { to: "/admin/categorias", label: "Categorías" },
  { to: "/admin/promociones", label: "Promociones" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/usuarios", label: "Usuarios" },
  { to: "/admin/sucursales", label: "Sucursales" },
  { to: "/admin/zonas-envio", label: "Zonas de envío" },
  { to: "/admin/configuracion", label: "Configuración" }
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-100 bg-white lg:flex">
        <div className="border-b border-ink-100 px-5 py-5">
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold text-brand-600">DULCI-NARD</span>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-ink-400">PANEL ADMIN</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
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
        <div className="border-t border-ink-100 px-5 py-4">
          <p className="text-sm font-semibold text-ink-800">{user?.name}</p>
          <p className="text-xs text-ink-400">{user?.email}</p>
          <button onClick={logout} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4 lg:hidden">
          <span className="font-display text-lg font-bold text-brand-600">Panel Admin</span>
          <Link to="/" className="text-sm font-medium text-ink-500">
            Ir al sitio
          </Link>
        </header>
        <main className="p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
