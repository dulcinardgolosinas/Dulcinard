import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Handshake, Zap } from "lucide-react";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { LogoWatermark } from "../components/ui/LogoWatermark";
import { HeroBackdrop } from "../components/ui/HeroBackdrop";
import { Button } from "../components/ui/Button";
import { fadeUp } from "../lib/motion";

function Hero() {
  return (
    <section className="relative overflow-hidden text-white">
      <HeroBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <motion.div initial="hidden" animate="show" className="max-w-2xl">
          <motion.span
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            Quiénes somos
          </motion.span>

          <motion.h1 custom={1} variants={fadeUp} className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            Una comunidad que
            <br />
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-brand-300 bg-clip-text text-transparent">
              crece de a mayor
            </span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="mt-6 max-w-lg text-base text-white/80 md:text-lg">
            Somos Dulcinard: distribuidora mayorista de golosinas y productos alimenticios con sede en San Miguel de
            Tucumán, y la confianza de cientos de kioscos y comercios de la provincia.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

const stats = [
  {
    value: "4",
    label: "Sucursales en Tucumán",
    icon: <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  },
  {
    value: "24 hs",
    label: "Entrega tras confirmar el pedido",
    icon: <path d="M12 7v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  },
  {
    value: "26,9 mil",
    label: "Seguidores en Instagram",
    icon: <path d="M17.2 6.8h.01M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
  }
];

function StatsFloat({ branchCount }) {
  return (
    <section className="relative -mt-14 z-10 mx-auto max-w-7xl px-4 md:px-6">
      <div className="grid gap-4 rounded-3xl bg-white p-4 shadow-[0_20px_60px_-20px_rgba(32,28,27,0.25)] sm:grid-cols-3 sm:p-5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group flex cursor-default items-center gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-brand-100 hover:bg-brand-50/60 hover:shadow-[0_12px_30px_-12px_rgba(184,24,48,0.35)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {s.icon}
              </svg>
            </div>
            <div>
              <p className="font-display text-2xl font-bold leading-none text-ink-900">
                {s.label.includes("Sucursales") ? branchCount : s.value}
              </p>
              <p className="mt-1.5 text-sm text-ink-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const values = [
  { title: "Calidad", desc: "Trabajamos con las marcas líderes del rubro golosinas y alimentos.", icon: Sparkles },
  { title: "Cercanía", desc: "4 sucursales pensadas para que siempre tengas una a mano.", icon: Handshake },
  { title: "Rapidez", desc: "Pedís hoy, lo tenés en tu local mañana. Sin vueltas.", icon: Zap }
];

function Story() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <LogoWatermark side="left" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:items-center md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
            Nuestra historia
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 md:text-3xl">
            De un mostrador en Tucumán a la distribuidora de confianza de cientos de kioscos
          </h2>
          <p className="mt-5 text-ink-600 leading-relaxed">
            Con años de trayectoria en la región, acompañamos a kioscos, almacenes y comercios de todo Tucumán
            ofreciendo un catálogo amplio, precios mayoristas y una logística pensada para que nunca te falte
            mercadería.
          </p>
          <p className="mt-4 text-ink-600 leading-relaxed">
            Hoy contamos con 4 sucursales en San Miguel de Tucumán y Concepción, y una comunidad de casi 27 mil
            seguidores en Instagram que siguen de cerca nuestras novedades y promociones.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/catalogo">
              <Button size="lg">Ver catálogo completo</Button>
            </Link>
            <Link to="/contacto">
              <Button size="lg" variant="outline">
                Nuestras sucursales
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-950 p-8 text-white shadow-xl"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-400/25 blur-3xl" />
          <p className="relative font-display text-xl font-bold leading-snug md:text-2xl">
            “Facilitarle a cada kiosco y comercio de Tucumán el acceso a golosinas y productos alimenticios al mejor
            precio mayorista.”
          </p>
          <p className="relative mt-5 text-sm font-semibold uppercase tracking-wide text-accent-300">
            Nuestro compromiso
          </p>
          <p className="relative mt-1 text-sm text-white/80">
            Con un proceso de pedido simple por WhatsApp o desde nuestra tienda online.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Values() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="group rounded-3xl border border-ink-100 bg-white p-7 text-center transition-shadow duration-300 hover:border-brand-200 hover:shadow-[0_20px_45px_-20px_rgba(184,24,48,0.3)]"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <v.icon className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-ink-900">{v.title}</p>
            <p className="mt-1.5 text-sm text-ink-500">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function QuienesSomos() {
  const config = useSiteConfigStore((s) => s.config);

  return (
    <div>
      <Hero />
      <StatsFloat branchCount={config?.branches?.length || 4} />
      <Story />
      <Values />
    </div>
  );
}
