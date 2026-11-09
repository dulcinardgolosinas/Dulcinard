import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { LogoWatermark } from "../components/ui/LogoWatermark";
import { HeroBackdrop } from "../components/ui/HeroBackdrop";
import { fadeUp } from "../lib/motion";
import { useSiteContent } from "../lib/siteContent";
import { Seo } from "../components/Seo";
import { branchMapUrl } from "../lib/branches";

function Hero({ waHref }) {
  const content = useSiteContent();
  return (
    <section className="relative overflow-hidden text-white">
      <HeroBackdrop page="contacto" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <motion.div initial="hidden" animate="show" className="max-w-2xl">
          <motion.span
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            Contacto
          </motion.span>

          <motion.h1 custom={1} variants={fadeUp} className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            {content.contactTitle}
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="mt-5 max-w-md text-base text-white/80 md:text-lg">
            {content.contactText}
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="mt-8">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 shadow-[0_8px_30px_-8px_rgba(200,2,25,0.7)] transition-transform group-hover:scale-110">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-600 opacity-60" />
                <svg className="relative h-7 w-7 text-white" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.386.694 4.61 1.897 6.484L4 29l7.72-1.858A11.9 11.9 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Z" />
                </svg>
              </span>
              <span>
                <span className="block text-sm text-white/70">Escribinos ahora</span>
                <span className="flex items-center gap-1.5 font-display text-xl font-bold group-hover:underline">
                  Iniciar conversación
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </span>
                <span className="mt-1 block text-sm text-white/60">Pedidos, consultas y coordinación de envíos</span>
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Branches({ branches }) {
  return (
    <section className="relative overflow-hidden mx-auto max-w-7xl px-4 py-16 md:px-6">
      <LogoWatermark side="right" />
      <div className="relative mb-8">
        <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
          <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-600 to-brand-600" />
          Encontranos
        </span>
        <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">Nuestras sucursales</h2>
      </div>

      <div className="relative flex flex-wrap justify-center gap-5">
        {branches.map((b, i) => (
          <motion.div
            key={b._id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className="group relative w-full overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 transition-shadow duration-300 hover:border-brand-200 hover:shadow-[0_20px_45px_-20px_rgba(200,2,25,0.3)] sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
          >
            {/* Número de la sucursal (01, 02...), entero dentro de la tarjeta. */}
            <span className="pointer-events-none absolute right-5 top-4 font-display text-5xl font-bold leading-none text-ink-100 transition-colors duration-300 group-hover:text-brand-100">
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-600 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
            </div>

            <p className="relative mt-4 font-display text-lg font-bold text-ink-900">{b.name}</p>
            <p className="relative mt-1 text-sm text-ink-500">{b.address}</p>

            <div className="relative mt-4 space-y-1.5 border-t border-ink-50 pt-4 text-xs text-ink-500">
              <p>
                <span className="font-semibold text-ink-700">{b.schedule?.weekdays?.label}:</span>{" "}
                {b.schedule?.weekdays?.hours}
              </p>
              <p>
                <span className="font-semibold text-ink-700">{b.schedule?.saturday?.label}:</span>{" "}
                {b.schedule?.saturday?.hours}
              </p>
            </div>

            {branchMapUrl(b) && (
              <a
                href={branchMapUrl(b)}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                Cómo llegar
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function Contacto() {
  const config = useSiteConfigStore((s) => s.config);
  const branches = config?.branches || [];
  const waNumber = config?.whatsappNumber || "3814091213";
  const waHref = `https://wa.me/549381${waNumber.replace(/\D/g, "").slice(-7)}`;

  return (
    <div>
      <Seo
        title="Contacto y sucursales"
        description="Hacé tu pedido por WhatsApp o visitá nuestras sucursales de Dulcinard en San Miguel de Tucumán, Yerba Buena y Concepción. Direcciones y horarios."
      />
      <Hero waHref={waHref} />
      <Branches branches={branches} />
    </div>
  );
}
