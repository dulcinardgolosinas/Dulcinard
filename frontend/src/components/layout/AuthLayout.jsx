import { Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { LogoWatermark } from "../ui/LogoWatermark";

const FALLBACK_LOGO = "https://res.cloudinary.com/dabikk5ei/image/upload/v1785899452/dulcinard/branding/rfwcpj2aorrjjlbtyzvz.png";

const TABS = [
  {
    to: "/login",
    label: "Iniciar sesión",
    title: "Ingresá a tu cuenta",
    subtitle: "Accedé para ver tu historial de pedidos y finalizar tu compra."
  },
  {
    to: "/registro",
    label: "Crear cuenta",
    title: "Creá tu cuenta mayorista",
    subtitle: "Registrate para hacer pedidos y ver tu historial de compras."
  }
];

export function AuthLayout() {
  const location = useLocation();
  const config = useSiteConfigStore((s) => s.config);
  const logoUrl = config?.logo?.url || FALLBACK_LOGO;
  const active = TABS.find((t) => t.to === location.pathname) || TABS[0];

  return (
    <div className="relative flex min-h-[calc(100vh-1px)] items-start justify-center overflow-hidden bg-white px-4 pb-14 pt-16 sm:pt-24">
      <LogoWatermark side="left" />
      <LogoWatermark side="right" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-3xl border border-ink-100 bg-white p-7 shadow-[0_20px_60px_-20px_rgba(32,28,27,0.25)] sm:p-9">
          <Link to="/" className="mb-6 flex justify-center">
            <img src={logoUrl} alt="Dulcinard" className="h-24 w-auto" />
          </Link>

          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-ink-900">{active.title}</h1>
            <p className="mt-1.5 text-sm text-ink-500">{active.subtitle}</p>
          </div>

          <div className="relative mt-6 flex rounded-full bg-ink-100 p-1 text-sm font-semibold">
            {TABS.map((tab) => {
              const isActive = tab.to === location.pathname;
              return (
                <Link key={tab.to} to={tab.to} className="relative flex-1 rounded-full py-2.5 text-center">
                  {isActive && (
                    <motion.span
                      layoutId="auth-switch-pill"
                      className="absolute inset-0 rounded-full bg-brand-600"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors ${isActive ? "text-white" : "text-ink-500 hover:text-ink-800"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6">
            <Outlet />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
