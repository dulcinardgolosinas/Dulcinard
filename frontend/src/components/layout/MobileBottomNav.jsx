import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Store, ShoppingCart, UserRound, Menu, Users, Truck, MessageCircle, MapPin } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { useSiteConfigStore } from "../../store/siteConfigStore";

const moreLinks = [
  { to: "/quienes-somos", label: "Quiénes somos", icon: Users },
  { to: "/envios", label: "Envíos y zonas", icon: Truck },
  { to: "/contacto", label: "Contacto", icon: MessageCircle }
];

// Bottom navigation estilo app, reemplaza el menú hamburguesa en mobile.
export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.openCart);
  const { isAuthenticated } = useAuthStore();
  const config = useSiteConfigStore((s) => s.config);
  const branches = config?.branches || [];

  const isHome = location.pathname === "/";
  const isCatalogo = location.pathname.startsWith("/catalogo") || location.pathname.startsWith("/producto");
  const isAccount = ["/perfil", "/login", "/registro", "/pedidos"].some((p) => location.pathname.startsWith(p));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-ink-100 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Link
          to="/"
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
            isHome ? "text-brand-600" : "text-ink-500"
          }`}
        >
          <Home className="h-5 w-5" strokeWidth={isHome ? 2.4 : 1.8} />
          Inicio
        </Link>

        <Link
          to="/catalogo"
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
            isCatalogo ? "text-brand-600" : "text-ink-500"
          }`}
        >
          <Store className="h-5 w-5" strokeWidth={isCatalogo ? 2.4 : 1.8} />
          Catálogo
        </Link>

        <button
          onClick={openCart}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium text-ink-500"
        >
          <span className="relative">
            <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          Carrito
        </button>

        <Link
          to={isAuthenticated ? "/perfil" : "/login"}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
            isAccount ? "text-brand-600" : "text-ink-500"
          }`}
        >
          <UserRound className="h-5 w-5" strokeWidth={isAccount ? 2.4 : 1.8} />
          Cuenta
        </Link>

        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium text-ink-500"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
          Menú
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm md:hidden"
              onClick={() => setMoreOpen(false)}
              aria-label="Cerrar menú"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl md:hidden"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" />
              <div className="space-y-1">
                {moreLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold ${
                        isActive ? "bg-brand-50 text-brand-600" : "text-ink-700 hover:bg-ink-50"
                      }`
                    }
                  >
                    <link.icon className="h-5 w-5 text-brand-600" strokeWidth={1.8} />
                    {link.label}
                  </NavLink>
                ))}
              </div>

              {branches.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-4">
                  <p className="mb-2 flex items-center gap-1.5 px-3 text-xs font-bold uppercase tracking-wide text-ink-400">
                    <MapPin className="h-3.5 w-3.5" /> Nuestras sucursales
                  </p>
                  <div className="grid grid-cols-2 gap-3 px-3">
                    {branches.map((b) => (
                      <div key={b._id} className="text-sm">
                        <p className="font-semibold text-ink-900">{b.name}</p>
                        <p className="text-xs text-ink-500">{b.address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
