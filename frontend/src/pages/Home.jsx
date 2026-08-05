import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { ProductCard } from "../components/product/ProductCard";
import { Button } from "../components/ui/Button";
import { PageLoader } from "../components/ui/Spinner";
import { formatCurrency } from "../lib/format";
import { fadeUp } from "../lib/motion";

const HERO_VIDEO_URL = "https://res.cloudinary.com/dabikk5ei/video/upload/v1785900628/video_golosinas_de71fs.mp4";

function Hero() {
  const config = useSiteConfigStore((s) => s.config);
  const waHref = `https://wa.me/549381${(config?.whatsappNumber || "3814091213").replace(/\D/g, "").slice(-7)}`;

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink-950 text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={HERO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Capas de contraste: oscurecen el video para que el texto y el header siempre se lean bien */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/55 to-ink-950/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
      <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-brand-500/30 blur-[100px]" />
      <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-accent-400/20 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-28 md:px-6">
        <motion.div initial="hidden" animate="show" className="max-w-2xl">
          <motion.span
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            Distribuidora mayorista · Tucumán
          </motion.span>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="mt-6 font-display text-5xl font-bold leading-[1.03] tracking-tight sm:text-6xl md:text-7xl"
          >
            Golosinas al
            <br />
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-brand-300 bg-clip-text text-transparent">
              por mayor
            </span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="mt-6 max-w-md text-base text-white/80 md:text-lg">
            Cientos de productos para kioscos y comercios de Tucumán. Pedí online o por WhatsApp y lo recibís en tu
            local en menos de <strong className="text-white">24 horas</strong>.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="mt-9 flex flex-wrap gap-4">
            <Link to="/catalogo">
              <Button
                variant="accent"
                size="lg"
                className="shadow-[0_8px_30px_-8px_rgba(255,184,31,0.6)] transition-transform hover:scale-105"
              >
                Ver catálogo completo
              </Button>
            </Link>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="!border-white/30 !bg-white/10 !text-white backdrop-blur-sm transition-transform hover:scale-105 hover:!bg-white/20"
              >
                <svg className="h-4 w-4" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.386.694 4.61 1.897 6.484L4 29l7.72-1.858A11.9 11.9 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Z" />
                </svg>
                Pedir por WhatsApp
              </Button>
            </a>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/70 sm:text-sm"
          >
            <span>Envíos desde {formatCurrency(config?.minPurchaseAmount ?? 500)}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>Costo de envío {formatCurrency(config?.defaultShippingCost ?? 80)}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>También en PedidosYa sin mínimo</span>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </section>
  );
}

const valueIcons = {
  truck: (
    <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  ),
  pin: <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  chat: <path d="M4 4h16v12H8l-4 4V4Z" />,
  bag: <path d="M21 8.5 12 3.5 3 8.5l9 5 9-5ZM3 8.5v7l9 5 9-5v-7M12 13.5v7" />
};

function ValueProps() {
  const items = [
    { icon: "truck", title: "Entrega en 24 hs", desc: "Confirmás tu pedido y lo recibís al día siguiente." },
    { icon: "pin", title: "4 sucursales en Tucumán", desc: "Belgrano, Córdoba, Av. Roca y Avellaneda (Concepción)." },
    { icon: "chat", title: "Pedidos por WhatsApp", desc: "Sin vueltas: mandás tu pedido y coordinás el pago." },
    { icon: "bag", title: "También en PedidosYa", desc: "Sin monto mínimo, elegís la sucursal más cercana." }
  ];
  return (
    <section className="relative -mt-14 z-10 mx-auto max-w-7xl px-4 md:px-6">
      <div className="grid gap-4 rounded-3xl bg-white p-4 shadow-[0_20px_60px_-20px_rgba(32,28,27,0.25)] sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group flex cursor-default items-start gap-3 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-brand-100 hover:bg-brand-50/60 hover:shadow-[0_12px_30px_-12px_rgba(184,24,48,0.35)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {valueIcons[item.icon]}
              </svg>
            </div>
            <div>
              <p className="font-display text-base font-bold leading-tight text-ink-900 transition-colors group-hover:text-brand-700">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-ink-500">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle, viewAllHref }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        {eyebrow && (
          <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link to={viewAllHref} className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          Ver todo
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

function ProductSection({ eyebrow, title, subtitle, products, viewAllHref }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} viewAllHref={viewAllHref} />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        transition={{ staggerChildren: 0.06 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {products.map((p, i) => (
          <motion.div key={p._id} custom={i} variants={fadeUp}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function PromotionsBanner({ promotions }) {
  if (!promotions.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeader eyebrow="No te lo pierdas" title="Promociones activas" />
      <div className="grid gap-5 md:grid-cols-2">
        {promotions.map((promo, i) => (
          <motion.div
            key={promo._id}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative flex min-h-[190px] flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-950 p-7 text-white shadow-lg"
            style={
              promo.banner?.url
                ? { backgroundImage: `url(${promo.banner.url})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity group-hover:from-black/85" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-400/20 blur-3xl" />
            <div className="relative">
              {promo.discountPercent > 0 && (
                <span className="inline-flex items-center rounded-full bg-accent-400 px-3 py-1 text-xs font-extrabold text-ink-900 shadow-sm">
                  {promo.discountPercent}% OFF
                </span>
              )}
              <p className="mt-3 font-display text-2xl font-bold">{promo.title}</p>
              {promo.description && <p className="mt-1.5 text-sm text-white/85">{promo.description}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [featuredRes, latestRes, promosRes] = await Promise.all([
          api.get("/products", { params: { featured: "true", limit: 10 } }),
          api.get("/products", { params: { limit: 10, sort: "-createdAt" } }),
          api.get("/promotions", { params: { activeOnly: "true" } })
        ]);
        if (!active) return;
        setFeatured(featuredRes.data.items);
        setLatest(latestRes.data.items);
        setPromotions(promosRes.data.slice(0, 4));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <Hero />
      <ValueProps />
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <PromotionsBanner promotions={promotions} />
          <ProductSection
            eyebrow="Lo más pedido"
            title="Destacados"
            subtitle="Los productos que más se piden"
            products={featured}
            viewAllHref="/catalogo?featured=true"
          />
          <ProductSection eyebrow="Novedades" title="Recién llegados" products={latest} viewAllHref="/catalogo" />
        </>
      )}
    </div>
  );
}
