import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Handshake, Zap } from "lucide-react";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { LogoWatermark } from "../components/ui/LogoWatermark";
import { HeroBackdrop } from "../components/ui/HeroBackdrop";
import { Button } from "../components/ui/Button";
import { fadeUp } from "../lib/motion";
import { useSiteContent, paragraphs } from "../lib/siteContent";
import { Seo } from "../components/Seo";

function Hero() {
  const content = useSiteContent();
  return (
    <section className="relative overflow-hidden text-white">
      <HeroBackdrop page="quienes-somos" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <motion.div initial="hidden" animate="show" className="max-w-2xl">
          <motion.span
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            Quiénes somos
          </motion.span>

          <motion.h1 custom={1} variants={fadeUp} className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            Una comunidad que
            <br />
            <span className="text-brand-600">crece de a mayor</span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="mt-6 max-w-lg text-base text-white/80 md:text-lg">
            {content.aboutIntro}
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
    value: "24-48 hs",
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
            className="group flex cursor-default items-center gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-brand-100 hover:bg-brand-50/60 hover:shadow-[0_12px_30px_-12px_rgba(200,2,25,0.35)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-600 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
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

const VALUE_ICONS = [Sparkles, Handshake, Zap];

function Story() {
  const content = useSiteContent();
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
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-600 to-brand-600" />
            Nuestra historia
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 md:text-3xl">{content.aboutStoryTitle}</h2>
          {paragraphs(content.aboutStory).map((text, i) => (
            <p key={i} className={`${i === 0 ? "mt-5" : "mt-4"} text-ink-600 leading-relaxed`}>
              {text}
            </p>
          ))}
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
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-ink-950 p-8 text-white shadow-xl"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/25 blur-3xl" />
          <p className="relative font-display text-xl font-bold leading-snug md:text-2xl">
            “{content.aboutQuote}”
          </p>
          <p className="relative mt-5 text-sm font-semibold uppercase tracking-wide text-white">
            Nuestro compromiso
          </p>
          <p className="relative mt-1 text-sm text-white/80">
            {content.aboutQuoteNote}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Values() {
  const content = useSiteContent();
  const values = [1, 2, 3].map((n, i) => ({ title: content[`value${n}Title`], desc: content[`value${n}Text`], icon: VALUE_ICONS[i] }));
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
            className="group rounded-3xl border border-ink-100 bg-white p-7 text-center transition-shadow duration-300 hover:border-brand-200 hover:shadow-[0_20px_45px_-20px_rgba(200,2,25,0.3)]"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-600 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
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
      <Seo
        title="Quiénes somos"
        description="Conocé Dulcinard: distribuidora mayorista de golosinas y comestibles en Tucumán, con sucursales en toda la provincia y las mejores marcas."
      />
      <Hero />
      <StatsFloat branchCount={config?.branches?.length || 4} />
      <Story />
      <Values />
    </div>
  );
}
