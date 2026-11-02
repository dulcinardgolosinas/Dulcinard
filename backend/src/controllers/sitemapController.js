import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// sitemap.xml para Google: las páginas de la tienda y cada producto visible.
// Se arma en el momento, así los productos nuevos aparecen solos. La tienda lo
// sirve en /sitemap.xml (ver frontend/vercel.json).

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/catalogo", priority: "0.9", changefreq: "daily" },
  { path: "/quienes-somos", priority: "0.5", changefreq: "monthly" },
  { path: "/contacto", priority: "0.5", changefreq: "monthly" },
  { path: "/envios", priority: "0.5", changefreq: "monthly" }
];

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

// Dirección pública de la tienda: SITE_URL, o la primera de CLIENT_URL.
export function siteUrl() {
  const url = process.env.SITE_URL || (process.env.CLIENT_URL || "").split(",")[0];
  return url.trim().replace(/\/$/, "") || "http://localhost:5173";
}

export const getSitemap = asyncHandler(async (req, res) => {
  const base = siteUrl();
  const products = await Product.find({ active: true }).select("slug updatedAt").sort({ updatedAt: -1 }).limit(45000).lean();

  const entries = [
    ...STATIC_PAGES.map((p) => `<url><loc>${escapeXml(base + p.path)}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`),
    ...products.map(
      (p) =>
        `<url><loc>${escapeXml(`${base}/producto/${p.slug}`)}</loc><lastmod>${new Date(p.updatedAt).toISOString().slice(0, 10)}</lastmod><priority>0.7</priority></url>`
    )
  ];

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`);
});
