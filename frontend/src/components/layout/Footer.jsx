import { Link } from "react-router-dom";
import { useSiteConfigStore } from "../../store/siteConfigStore";

export function Footer() {
  const config = useSiteConfigStore((s) => s.config);
  const branches = config?.branches || [];

  return (
    <footer className="mt-16 border-t border-ink-100 bg-brand-950 text-ink-200">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 text-center md:grid-cols-[1.1fr_2fr] md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="inline-flex items-center gap-2">
              {config?.logo?.url ? (
                <img src={config.logo.url} alt={config.brandName || "Dulcinard"} className="h-28 w-auto" />
              ) : (
                <div className="flex flex-col leading-none">
                  <span className="font-display text-2xl font-bold text-white">DULCINARD</span>
                  <span className="text-[11px] font-semibold tracking-[0.25em] text-ink-400">TUCUMÁN</span>
                </div>
              )}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-400">
              Distribuidora mayorista de golosinas y productos alimenticios. Pedidos por WhatsApp con entrega en 24 a 48 hs.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {config?.instagram && (
                <a
                  href={config.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-600"
                  aria-label="Instagram"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              <a
                href="https://www.facebook.com/dulcinard/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-600"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.36C16.19 4.32 15.13 4.22 13.9 4.22c-2.55 0-4.29 1.56-4.29 4.42v2.86H7v3h2.61V21h3.89Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* En celular las sucursales alargaban mucho el footer: se muestran
              solo desde tablet (en celular están en Inicio, Contacto y Quiénes somos). */}
          <div className="hidden gap-x-4 gap-y-6 md:grid md:grid-cols-2 lg:grid-cols-4">
            {branches.map((b) => (
              <div key={b._id} className="text-left">
                <p className="text-sm font-semibold text-white">{b.name}</p>
                <p className="mt-1 text-xs text-ink-400">{b.address}</p>
                <p className="mt-2 text-xs text-ink-500">{b.schedule?.weekdays?.label}</p>
                <p className="text-xs text-ink-400">{b.schedule?.weekdays?.hours}</p>
                <p className="mt-1.5 text-xs text-ink-500">{b.schedule?.saturday?.label}</p>
                <p className="text-xs text-ink-400">{b.schedule?.saturday?.hours}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Dulcinard Tucumán. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link to="/envios" className="hover:text-white">
              Envíos y zonas
            </Link>
            <Link to="/contacto" className="hover:text-white">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
