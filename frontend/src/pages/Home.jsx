import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { api } from "../lib/api";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { ProductCard } from "../components/product/ProductCard";
import { Button } from "../components/ui/Button";
import { PageLoader, Spinner } from "../components/ui/Spinner";
import { formatCurrency } from "../lib/format";
import { fadeUp } from "../lib/motion";

const HERO_VIDEO_URL = "https://res.cloudinary.com/dabikk5ei/video/upload/v1785900628/video_golosinas_de71fs.mp4";

function Hero() {
  const config = useSiteConfigStore((s) => s.config);
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .get("/home-hero-images")
      .then(({ data }) => {
        if (active) setImages(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink-950 text-white">
      {images.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={images[index]._id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${images[index].image.url})` }}
          />
        </AnimatePresence>
      ) : (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
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
            <span className="text-accent-600">por mayor</span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="mt-6 max-w-md text-base text-white/80 md:text-lg">
            Cientos de productos para kioscos y comercios de Tucumán. Pedí online y lo recibís en tu local en{" "}
            <strong className="text-white">24 a 48 horas</strong>.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="mt-9 flex flex-wrap gap-4">
            <Link to="/catalogo">
              <Button
                variant="accent"
                size="lg"
                className="shadow-[0_8px_30px_-8px_rgba(229,31,31,0.6)] transition-transform hover:scale-105"
              >
                Ver catálogo completo
              </Button>
            </Link>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/70 sm:text-sm"
          >
            <span>Compra mínima {formatCurrency(config?.minPurchaseAmount ?? 100000)}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>Costo de envío {formatCurrency(config?.defaultShippingCost ?? 3500)}</span>
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
  chat: <path d="M4 4h16v12H8l-4 4V4Z" />
};

function ValueProps() {
  const config = useSiteConfigStore((s) => s.config);
  const branches = config?.branches || [];
  const items = [
    { icon: "truck", title: "Entrega en 24 a 48 hs", desc: "Confirmás tu pedido y lo recibís en tu local." },
    {
      icon: "pin",
      title: `${branches.length || 5} sucursales en Tucumán`,
      desc: branches.length ? branches.map((b) => b.name).join(", ") : "Distribuidas en toda la provincia."
    },
    { icon: "chat", title: "Pedidos por WhatsApp", desc: "Sin vueltas: mandás tu pedido y coordinás el pago." }
  ];
  return (
    <section className="relative -mt-14 z-10 mx-auto max-w-7xl px-4 md:px-6">
      <div className="grid gap-4 rounded-3xl bg-white p-4 shadow-[0_20px_60px_-20px_rgba(32,28,27,0.25)] sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
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


function PromotionsBanner({ promotions }) {
  const config = useSiteConfigStore((s) => s.config);
  if (!promotions.length) return null;

  const waNumber = config?.whatsappNumber || "3814091213";
  const items = promotions.length < 4 ? [...promotions, ...promotions] : promotions;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader eyebrow="No te lo pierdas" title="Promociones activas" />
      </div>

      <div className="scrollbar-thin overflow-hidden">
        <motion.div
          className="flex w-max gap-5 px-4 md:px-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: items.length * 6, repeat: Infinity, ease: "linear" }}
        >
          {[...items, ...items].map((promo, i) => {
            const waHref = `https://wa.me/549381${waNumber.replace(/\D/g, "").slice(-7)}?text=${encodeURIComponent(
              `¡Hola! Quiero consultar por la promo "${promo.title}"`
            )}`;
            return (
              <a
                key={`${promo._id}-${i}`}
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex w-72 shrink-0 flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_20px_45px_-25px_rgba(32,28,27,0.3)] transition-shadow hover:shadow-[0_25px_50px_-20px_rgba(184,24,48,0.35)] sm:w-80"
              >
                <div
                  className="relative h-36 bg-cover bg-center bg-gradient-to-br from-brand-600 via-brand-700 to-ink-950"
                  style={promo.banner?.url ? { backgroundImage: `url(${promo.banner.url})` } : undefined}
                >
                  {promo.discountPercent > 0 && (
                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-accent-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                      {promo.discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-display text-lg font-bold text-ink-900">{promo.title}</p>
                  {promo.description && <p className="mt-1 text-sm text-ink-500">{promo.description}</p>}
                  <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-700">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 4h16v12H8l-4 4V4Z" />
                    </svg>
                    Consultar
                  </span>
                </div>
              </a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function CategoryFilterBar({ categories, activeCategory, onSelect }) {
  return (
    <div className="scrollbar-thin mb-4 flex flex-wrap justify-center gap-2 overflow-x-auto px-4 pb-1">
      <button
        onClick={() => onSelect("")}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          !activeCategory ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 text-ink-600 hover:border-brand-300"
        }`}
      >
        Todas
      </button>
      {categories.map((c) => (
        <button
          key={c._id}
          onClick={() => onSelect(c._id)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            activeCategory === c._id ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 text-ink-600 hover:border-brand-300"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

function CategoryProductRow({ category, products, loading }) {
  if (!loading && products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <SectionHeader
        eyebrow="Categoría"
        title={category.name}
        subtitle={category.description}
        viewAllHref={`/catalogo?category=${category._id}`}
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : (
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
      )}
    </section>
  );
}

function CategoriesSection({ categories, productsByCategory, loadingProducts, activeCategory, onSelect }) {
  if (!categories.length) return null;
  const categoriesToShow = activeCategory ? categories.filter((c) => c._id === activeCategory) : categories;

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 md:px-6">
        <div className="text-center">
          <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
            Explorá por categoría
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 md:text-3xl">Nuestras categorías</h2>
        </div>
        <div className="mt-6">
          <CategoryFilterBar categories={categories} activeCategory={activeCategory} onSelect={onSelect} />
        </div>
      </section>

      {categoriesToShow.map((c) => (
        <CategoryProductRow key={c._id} category={c} products={productsByCategory[c._id] || []} loading={loadingProducts} />
      ))}
    </>
  );
}

function BranchesSlideshow({ branches }) {
  const slides = branches.filter((b) => b.image?.url).sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[index];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeader eyebrow="Conocenos" title="Nuestras sucursales" subtitle="Visitanos en cualquiera de nuestros depósitos" viewAllHref="/contacto" />

      <div className="relative h-72 overflow-hidden rounded-3xl sm:h-96">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image.url})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white sm:p-8">
          <div>
            {slide.primary && (
              <span className="mb-2 inline-block rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                Sucursal principal
              </span>
            )}
            <p className="flex items-center gap-1.5 font-display text-2xl font-bold sm:text-3xl">
              <MapPin className="h-5 w-5 shrink-0 text-accent-400" />
              {slide.name}
            </p>
            <p className="mt-1 text-sm text-white/80">{slide.address}</p>
          </div>

          {slides.length > 1 && (
            <div className="flex shrink-0 gap-1.5 pb-1">
              {slides.map((s, i) => (
                <button
                  key={s._id}
                  onClick={() => setIndex(i)}
                  aria-label={`Ver sucursal ${s.name}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProvidersCarousel({ providers }) {
  if (!providers.length) return null;
  const items = [...providers, ...providers]; // duplicado para loop continuo

  return (
    <section className="border-y border-ink-100 bg-ink-50 py-12">
      <div className="mx-auto mb-8 max-w-7xl px-4 text-center md:px-6">
        <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
          <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
          Nuestras marcas
        </span>
        <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">Marcas con las que trabajamos</h2>
      </div>
      <div className="scrollbar-thin overflow-hidden py-6">
        <motion.div
          className="flex w-max items-center gap-16"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: providers.length * 4, repeat: Infinity, ease: "linear" }}
        >
          {items.map((p, i) => (
            <img
              key={`${p._id}-${i}`}
              src={p.logo.url}
              alt={p.name}
              className="h-24 w-auto shrink-0 object-contain opacity-90 transition-all hover:scale-125 hover:opacity-100"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const config = useSiteConfigStore((s) => s.config);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [productsByCategory, setProductsByCategory] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [categoriesRes, providersRes, promosRes] = await Promise.all([
          api.get("/categories"),
          api.get("/providers"),
          api.get("/promotions", { params: { activeOnly: "true" } })
        ]);
        if (!active) return;
        setCategories(categoriesRes.data);
        setProviders(providersRes.data);
        setPromotions(promosRes.data.slice(0, 4));

        const productResponses = await Promise.all(
          categoriesRes.data.map((c) => api.get("/products", { params: { category: c._id, limit: 8, sort: "-createdAt" } }))
        );
        if (!active) return;
        const byCategory = {};
        categoriesRes.data.forEach((c, i) => {
          byCategory[c._id] = productResponses[i].data.items;
        });

        // "Artículos Varios" es una vidriera: en vez de requerir que se
        // etiqueten productos ahí a mano, junta 1-2 de cada otra categoría.
        const misc = categoriesRes.data.find((c) => c.name === "Artículos Varios");
        if (misc) {
          const mix = categoriesRes.data
            .filter((c) => c._id !== misc._id)
            .flatMap((c) => (byCategory[c._id] || []).slice(0, 2));
          byCategory[misc._id] = mix;
        }

        setProductsByCategory(byCategory);
      } finally {
        if (active) {
          setLoading(false);
          setLoadingProducts(false);
        }
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
          <ProvidersCarousel providers={providers} />
          <PromotionsBanner promotions={promotions} />
          <CategoriesSection
            categories={categories}
            productsByCategory={productsByCategory}
            loadingProducts={loadingProducts}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          <BranchesSlideshow branches={config?.branches || []} />
        </>
      )}
    </div>
  );
}
