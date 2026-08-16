import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Truck, Bike, Package } from "lucide-react";
import { api } from "../lib/api";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { formatCurrency } from "../lib/format";
import { PageLoader } from "../components/ui/Spinner";
import { LogoWatermark } from "../components/ui/LogoWatermark";
import { HeroBackdrop } from "../components/ui/HeroBackdrop";
import { fadeUp } from "../lib/motion";

function Hero() {
  const config = useSiteConfigStore((s) => s.config);
  return (
    <section className="relative overflow-hidden text-white">
      <HeroBackdrop page="envios" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <motion.div initial="hidden" animate="show" className="max-w-2xl">
          <motion.span
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            Envíos
          </motion.span>

          <motion.h1 custom={1} variants={fadeUp} className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            Lo llevamos
            <br />
            <span className="text-accent-600">hasta tu local</span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="mt-6 max-w-lg text-base text-white/80 md:text-lg">
            Zonas de cobertura, tiempos y costos de envío — para que sepas exactamente cuándo y cómo llega tu pedido.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            <span>Entrega en {config?.deliveryEtaHours ?? 24}–{config?.deliveryEtaMaxHours ?? 48} hs</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>Compra mínima {formatCurrency(config?.minPurchaseAmount ?? 100000)}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const steps = [
  {
    title: "Pedís por WhatsApp",
    desc: "Nos mandás tus datos, dirección y método de pago.",
    icon: <path d="M4 4h16v12H8l-4 4V4Z" />
  },
  {
    title: "Confirmamos tu pedido",
    desc: "Coordinamos stock, pago y horario de entrega.",
    icon: <path d="M20 6 9 17l-5-5" />
  },
  {
    title: "Lo recibís en tu local",
    desc: "Dentro de las 24 a 48 hs, en la puerta de tu comercio.",
    icon: <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  }
];

function ProcessSteps() {
  return (
    <section className="relative -mt-14 z-10 mx-auto max-w-7xl px-4 md:px-6">
      <div className="grid gap-6 rounded-3xl bg-white p-6 shadow-[0_20px_60px_-20px_rgba(32,28,27,0.25)] sm:p-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative flex gap-4"
          >
            <div className="relative flex shrink-0 flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {s.icon}
                </svg>
              </div>
              <span className="mt-2 font-display text-xs font-bold text-brand-300">0{i + 1}</span>
            </div>
            <div className="pt-1">
              <p className="font-display text-base font-bold text-ink-900">{s.title}</p>
              <p className="mt-1 text-sm text-ink-500">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const zoneIcons = [MapPin, Truck, Bike, Package];

function ZonesGrid({ zones, loading }) {
  if (loading) return <PageLoader />;
  if (!zones.length) return null;

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <LogoWatermark side="right" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
          <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
          Cobertura
        </span>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 md:text-3xl">Zonas y costos de envío</h2>
        <p className="mt-2 max-w-lg text-sm text-ink-500">
          Envío por delivery propio. Valores de referencia, pueden variar por zona.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((z, i) => {
            const ZoneIcon = zoneIcons[i % zoneIcons.length];
            return (
            <motion.div
              key={z._id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 transition-shadow duration-300 hover:border-brand-200 hover:shadow-[0_20px_45px_-20px_rgba(184,24,48,0.3)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <ZoneIcon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <p className="mt-4 font-display text-lg font-bold text-ink-900">{z.name}</p>

              <div className="mt-4 space-y-2 border-t border-ink-50 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Monto mínimo</span>
                  <span className="font-semibold text-ink-900">{formatCurrency(z.minPurchaseAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Costo de envío</span>
                  <span className="font-semibold text-brand-600">{formatCurrency(z.cost)}</span>
                </div>
                {z.freeShippingFrom > 0 && (
                  <p className="rounded-lg bg-accent-50 px-2.5 py-1.5 text-xs font-medium text-accent-800">
                    Gratis desde {formatCurrency(z.freeShippingFrom)}
                  </p>
                )}
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function ZonasEnvio() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/shipping-zones")
      .then(({ data }) => setZones(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Hero />
      <ProcessSteps />
      <ZonesGrid zones={zones} loading={loading} />
    </div>
  );
}
