import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { formatCurrency } from "../lib/format";
import { PageLoader } from "../components/ui/Spinner";

export default function ZonasEnvio() {
  const config = useSiteConfigStore((s) => s.config);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/shipping-zones")
      .then(({ data }) => setZones(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
      <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">Envíos</span>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink-900 md:text-4xl">Zonas de cobertura y envíos</h1>

      <div className="mt-6 space-y-3 text-ink-600">
        <p>Hacé tu pedido por WhatsApp enviando tus datos, dirección y método de pago.</p>
        <p>
          Una vez confirmado el pedido, lo recibís en tu local dentro de las {config?.deliveryEtaHours ?? 24} horas.
        </p>
        <p>
          También estamos en <strong>PedidosYa</strong>, sin monto mínimo de compra, con nuestras 4 sucursales dadas
          de alta para que elijas la más cercana a tu domicilio.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6">
        <p className="font-semibold text-ink-900">Envío por delivery propio</p>
        <p className="mt-1 text-sm text-ink-500">
          Envíos a partir de {formatCurrency(config?.minPurchaseAmount ?? 500)}, con un costo de envío de{" "}
          {formatCurrency(config?.defaultShippingCost ?? 80)} (valores de referencia, pueden variar por zona).
        </p>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        zones.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-5 py-3">Zona</th>
                  <th className="px-5 py-3">Monto mínimo</th>
                  <th className="px-5 py-3">Costo de envío</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z._id} className="border-t border-ink-50">
                    <td className="px-5 py-3 font-medium text-ink-900">{z.name}</td>
                    <td className="px-5 py-3 text-ink-600">{formatCurrency(z.minPurchaseAmount)}</td>
                    <td className="px-5 py-3 text-ink-600">
                      {z.freeShippingFrom > 0
                        ? `${formatCurrency(z.cost)} (gratis desde ${formatCurrency(z.freeShippingFrom)})`
                        : formatCurrency(z.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
