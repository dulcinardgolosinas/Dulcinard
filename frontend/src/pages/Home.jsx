import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { api } from "../lib/api";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { ProductCard } from "../components/product/ProductCard";
import { fadeUp } from "../lib/motion";
import { getCategories } from "../lib/categories";
import { cldUrl } from "../lib/cloudinary";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { scrollToProducts } from "../lib/navigation";
import { HomePromotions } from "../components/home/HomePromotions";
import { PromoPopup } from "../components/home/PromoPopup";
import { Seo } from "../components/Seo";

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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-600 text-white shadow-md shadow-brand-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
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
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-600 to-brand-600" />
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl border border-ink-100 bg-white ${i >= 2 ? "hidden sm:block" : ""} ${i >= 3 ? "sm:hidden lg:block" : ""}`}
            >
              <div className="aspect-square animate-pulse bg-ink-100" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
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
            <motion.div key={p._id} custom={i} variants={fadeUp} className="h-full">
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function CategoriesSection({ categories, productsByCategory, loadingProducts, activeCategory, onSelect }) {
  if (!categories) return <section id="productos" className="min-h-[50vh] scroll-mt-28" aria-busy="true" />;
  if (!categories.length) return null;
  const categoriesToShow = activeCategory ? categories.filter((c) => c._id === activeCategory) : categories;

  return (
    <>
      <section id="productos" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-10 md:px-6">
        <div className="text-center">
          <span className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-600">
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-600 to-brand-600" />
            Explorá por categoría
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 md:text-3xl">Nuestras categorías</h2>
          <Link to="/catalogo" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Ver el catálogo completo
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
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
              <MapPin className="h-5 w-5 shrink-0 text-white" />
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
          <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-brand-600 to-brand-600" />
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
              src={cldUrl(p.logo.url, { height: 192 })}
              loading="lazy"
              alt={p.name}
              className="h-24 w-auto shrink-0 object-contain opacity-90 transition-all hover:scale-125 hover:opacity-100"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Botones de categorías justo debajo del carrusel: filtran los productos de
// la página y bajan hasta ellos, para encontrar lo que se busca más rápido.
function QuickCategoryPills({ categories, activeCategory, onSelect }) {
  if (!categories?.length) return <div className="mt-6 h-[68px]" aria-hidden="true" />;

  function pick(id) {
    onSelect(id);
    scrollToProducts();
  }

  return (
    <nav aria-label="Categorías" className="mt-6 bg-white">
      <div className="scrollbar-thin mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 md:flex-wrap md:justify-center md:px-6">
        <button
          type="button"
          onClick={() => pick("")}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            !activeCategory ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 text-ink-700 hover:border-brand-300 hover:text-brand-700"
          }`}
        >
          Todos los productos
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => pick(c._id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              activeCategory === c._id
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-200 text-ink-700 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </nav>
  );
}

// Datos del negocio para Google: nombre, logo, redes y cada sucursal.
function businessJsonLd(config) {
  const origin = window.location.origin;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Dulcinard Tucumán",
    url: origin,
    logo: config?.logo?.url || undefined,
    description: "Distribuidora mayorista de golosinas y productos alimenticios en Tucumán.",
    sameAs: [config?.instagram, config?.facebook].filter(Boolean),
    department: (config?.branches || [])
      .filter((b) => b.active !== false)
      .map((b) => ({
        "@type": "Store",
        name: `Dulcinard ${b.name}`,
        image: b.image?.url || config?.logo?.url || undefined,
        telephone: b.phone || undefined,
        address: { "@type": "PostalAddress", streetAddress: b.address, addressRegion: "Tucumán", addressCountry: "AR" },
        hasMap: b.mapUrl || undefined
      }))
  };
}

export default function Home() {
  const config = useSiteConfigStore((s) => s.config);
  const [categories, setCategories] = useState(null); // null = cargando
  const [providers, setProviders] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [productsByCategory, setProductsByCategory] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { hash } = useLocation();

  // Llegando desde otra página con /#promociones o /#productos se baja hasta esa sección.
  useEffect(() => {
    if (!hash) return;
    const timer = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 400);
    return () => clearTimeout(timer);
  }, [hash]);

  // Cada sección carga por su cuenta: la página se muestra enseguida y cada
  // parte aparece apenas tiene sus datos (las promos se cargan en HomePromotions).
  useEffect(() => {
    let active = true;

    api
      .get("/providers")
      .then(({ data }) => active && setProviders(data))
      .catch(() => {});

    async function loadProducts() {
      try {
        const list = await getCategories();
        if (!active) return;
        setCategories(list);

        const productResponses = await Promise.all(
          list.map((c) =>
            api
              .get("/products", { params: { category: c._id, limit: 8, sort: "-createdAt" } })
              .then((r) => r.data.items)
              .catch(() => [])
          )
        );
        if (!active) return;
        const byCategory = {};
        list.forEach((c, i) => {
          byCategory[c._id] = productResponses[i];
        });

        // "Artículos Varios" es una vidriera: en vez de requerir que se
        // etiqueten productos ahí a mano, junta 1-2 de cada otra categoría.
        const misc = list.find((c) => c.name === "Artículos Varios");
        if (misc) {
          byCategory[misc._id] = list.filter((c) => c._id !== misc._id).flatMap((c) => (byCategory[c._id] || []).slice(0, 2));
        }
        setProductsByCategory(byCategory);
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }
    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <Seo jsonLd={businessJsonLd(config)} />
      <PromoPopup />
      <HeroCarousel />
      <ValueProps />
      <QuickCategoryPills categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
      <ProvidersCarousel providers={providers} />
      <HomePromotions />
      <CategoriesSection
        categories={categories}
        productsByCategory={productsByCategory}
        loadingProducts={loadingProducts}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />
      <BranchesSlideshow branches={config?.branches || []} />
    </div>
  );
}
