import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCartStore } from "../store/cartStore";
import { formatCurrency, finalPriceOf, UNIT_LABELS } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { PageLoader } from "../components/ui/Spinner";
import { Seo } from "../components/Seo";
import { cldUrl } from "../lib/cloudinary";

export default function ProductoDetalle() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        setQty(data.minOrderQty || 1);
        setActiveImage(0);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageLoader />;
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-ink-500">No encontramos este producto.</p>
        <Link to="/catalogo" className="mt-3 inline-block text-sm font-semibold text-brand-600">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const outOfStock = product.stock <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Seo
        title={product.name}
        description={
          product.description ||
          `${product.name}${product.brand ? ` (${product.brand})` : ""} al por mayor en Dulcinard Tucumán. Precio mayorista ${formatCurrency(finalPriceOf(product))}. Pedí online.`
        }
        image={images[0]?.url ? cldUrl(images[0].url, { width: 1200 }) : undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || undefined,
          brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
          sku: product.sku || undefined,
          image: images.map((img) => img.url),
          offers: {
            "@type": "Offer",
            price: finalPriceOf(product),
            priceCurrency: "ARS",
            availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            url: window.location.href
          }
        }}
      />
      <nav className="mb-6 text-xs text-ink-400">
        <Link to="/catalogo" className="hover:text-brand-600">
          Catálogo
        </Link>
        {product.category?.name && (
          <>
            {" / "}
            <Link to={`/catalogo?category=${product.category._id}`} className="hover:text-brand-600">
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink-600">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-ink-100 bg-white">
            {images[activeImage] ? (
              <img src={images[activeImage].url} alt={product.name} className="h-full w-full object-contain p-4" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-200">
                <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="m3 16 5-5 4 4 5-6 4 5" />
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.publicId}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                    activeImage === i ? "border-brand-600" : "border-transparent"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full bg-white object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand && <p className="text-sm font-semibold uppercase tracking-wide text-ink-400">{product.brand}</p>}
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            <p className="text-3xl font-bold text-brand-600">{formatCurrency(finalPriceOf(product))}</p>
            {product.discountPercent > 0 && (
              <>
                <p className="text-lg text-ink-400 line-through">{formatCurrency(product.price)}</p>
                <Badge tone="success">{product.discountPercent}% OFF</Badge>
              </>
            )}
            <Badge tone="neutral">x {UNIT_LABELS[product.unit] || product.unit}</Badge>
          </div>

          <p className="mt-2 text-sm text-ink-500">
            {outOfStock ? (
              <span className="font-semibold text-danger-600">Sin stock disponible</span>
            ) : (
              <>Stock disponible: {product.stock} · Pedido mínimo: {product.minOrderQty}</>
            )}
          </p>

          {product.description && <p className="mt-5 leading-relaxed text-ink-600">{product.description}</p>}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-ink-200">
              <button
                className="px-4 py-2.5 text-lg text-ink-500"
                onClick={() => setQty((q) => Math.max(product.minOrderQty || 1, q - 1))}
              >
                −
              </button>
              <span className="min-w-[3ch] text-center font-semibold">{qty}</span>
              <button className="px-4 py-2.5 text-lg text-ink-500" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>
                +
              </button>
            </div>
            <Button size="lg" disabled={outOfStock} onClick={() => addItem(product, qty)} className="flex-1">
              Agregar al carrito
            </Button>
          </div>

          <p className="mt-4 text-xs text-ink-400">Subtotal: {formatCurrency(finalPriceOf(product) * qty)}</p>
        </div>
      </div>
    </div>
  );
}
