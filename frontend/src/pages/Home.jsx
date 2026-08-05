import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSiteConfigStore } from "../store/siteConfigStore";
import { ProductCard } from "../components/product/ProductCard";
import { Button } from "../components/ui/Button";
import { PageLoader } from "../components/ui/Spinner";
import { formatCurrency } from "../lib/format";

function Hero() {
  const config = useSiteConfigStore((s) => s.config);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
      <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wide">
            Distribuidora mayorista · Tucumán
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] md:text-5xl">
            Golosinas y productos alimenticios al por mayor, con entrega en 24&nbsp;hs
          </h1>
          <p className="mt-4 max-w-md text-sm text-brand-100 md:text-base">
            Cientos de productos para kioscos y comercios. Hacé tu pedido online o por WhatsApp y lo recibís en tu
            local en menos de 24 horas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/catalogo">
              <Button variant="accent" size="lg">
                Ver catálogo completo
              </Button>
            </Link>
            <a
              href={`https://wa.me/549381${(config?.whatsappNumber || "3814091213").replace(/\D/g, "").slice(-7)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="!bg-white/10 !border-white/30 !text-white hover:!bg-white/20">
                Pedir por WhatsApp
              </Button>
            </a>
          </div>
          <p className="mt-6 text-xs text-brand-100/80">
            Envíos desde {formatCurrency(config?.minPurchaseAmount ?? 500)} · Costo de envío{" "}
            {formatCurrency(config?.defaultShippingCost ?? 80)} · También en PedidosYa sin mínimo de compra
          </p>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-4">
            {["🍬", "🍫", "🍭", "🥤"].map((emoji, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-3xl bg-white/10 text-6xl backdrop-blur ${
                  i % 2 ? "mt-8" : ""
                }`}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueProps() {
  const items = [
    { title: "Entrega en 24 hs", desc: "Confirmás tu pedido y lo recibís al día siguiente." },
    { title: "4 sucursales en Tucumán", desc: "Belgrano, Córdoba, Av. Roca y Avellaneda (Concepción)." },
    { title: "Pedidos por WhatsApp", desc: "Sin vueltas: mandás tu pedido y coordinás el pago." },
    { title: "También en PedidosYa", desc: "Sin monto mínimo, elegís la sucursal más cercana." }
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-ink-100 bg-white p-5">
            <p className="font-display text-lg font-bold text-ink-900">{item.title}</p>
            <p className="mt-1.5 text-sm text-ink-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ title, subtitle, products, viewAllHref }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </div>
        <Link to={viewAllHref} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Ver todo →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}

function PromotionsBanner({ promotions }) {
  if (!promotions.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h2 className="mb-5 text-2xl font-bold text-ink-900">Promociones activas</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {promotions.map((promo) => (
          <div
            key={promo._id}
            className="relative flex min-h-[160px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 p-6 text-ink-900"
            style={
              promo.banner?.url
                ? { backgroundImage: `url(${promo.banner.url})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            {promo.banner?.url && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />}
            <div className={`relative ${promo.banner?.url ? "text-white" : ""}`}>
              {promo.discountPercent > 0 && (
                <span className="inline-block rounded-full bg-ink-950/80 px-3 py-1 text-xs font-bold text-white">
                  {promo.discountPercent}% OFF
                </span>
              )}
              <p className="mt-2 font-display text-xl font-bold">{promo.title}</p>
              {promo.description && <p className="mt-1 text-sm opacity-90">{promo.description}</p>}
            </div>
          </div>
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
          <ProductSection title="Destacados" subtitle="Los productos que más se piden" products={featured} viewAllHref="/catalogo?featured=true" />
          <ProductSection title="Recién llegados" products={latest} viewAllHref="/catalogo" />
        </>
      )}
    </div>
  );
}
