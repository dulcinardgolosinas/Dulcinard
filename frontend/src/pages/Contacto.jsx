import { useSiteConfigStore } from "../store/siteConfigStore";
import { Button } from "../components/ui/Button";

export default function Contacto() {
  const config = useSiteConfigStore((s) => s.config);
  const branches = config?.branches || [];
  const waNumber = config?.whatsappNumber || "3814091213";
  const waHref = `https://wa.me/549381${waNumber.replace(/\D/g, "").slice(-7)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
      <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">Contacto</span>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink-900 md:text-4xl">Nuestras sucursales</h1>
      <p className="mt-3 max-w-2xl text-ink-500">
        Hacé tu pedido por WhatsApp o acercate a cualquiera de nuestras sucursales en San Miguel de Tucumán y
        Concepción.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl bg-[#25D366] p-6 text-white transition-transform hover:scale-[1.01]"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">WhatsApp</p>
            <p className="mt-1 font-display text-2xl font-bold">{waNumber}</p>
            <p className="mt-1 text-sm opacity-90">Pedidos, consultas y coordinación de envíos</p>
          </div>
          <svg className="h-10 w-10 shrink-0" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.386.694 4.61 1.897 6.484L4 29l7.72-1.858A11.9 11.9 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Z" />
          </svg>
        </a>

        {config?.pedidosYaUrl ? (
          <a
            href={config.pedidosYaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl bg-ink-900 p-6 text-white transition-transform hover:scale-[1.01]"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide opacity-70">PedidosYa</p>
              <p className="mt-1 font-display text-2xl font-bold">Sin monto mínimo</p>
              <p className="mt-1 text-sm opacity-80">Elegí la sucursal más cercana a tu domicilio</p>
            </div>
          </a>
        ) : (
          <div className="flex items-center justify-between rounded-2xl bg-ink-900 p-6 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide opacity-70">También en PedidosYa</p>
              <p className="mt-1 font-display text-2xl font-bold">Sin monto mínimo</p>
              <p className="mt-1 text-sm opacity-80">Buscanos como Dulci-Nard con nuestras 4 sucursales</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {branches.map((b) => (
          <div key={b._id} className="rounded-2xl border border-ink-100 bg-white p-5">
            <p className="font-display text-lg font-bold text-ink-900">{b.name}</p>
            <p className="mt-1 text-sm text-ink-500">{b.address}</p>
            <div className="mt-4 space-y-1 text-xs text-ink-500">
              <p>
                <span className="font-semibold text-ink-700">{b.schedule?.weekdays?.label}:</span>{" "}
                {b.schedule?.weekdays?.hours}
              </p>
              <p>
                <span className="font-semibold text-ink-700">{b.schedule?.saturday?.label}:</span>{" "}
                {b.schedule?.saturday?.hours}
              </p>
            </div>
            {b.mapUrl && (
              <a href={b.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                <Button size="sm" variant="outline">
                  Cómo llegar
                </Button>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
