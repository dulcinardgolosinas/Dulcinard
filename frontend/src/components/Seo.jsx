import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Dulcinard Tucumán";
const DEFAULT_TITLE = "Dulcinard Tucumán — Mayorista de golosinas";
const DEFAULT_DESCRIPTION =
  "Dulcinard Tucumán: distribuidora mayorista de golosinas y productos alimenticios para kioscos y comercios. Pedí online y recibilo en tu local en 24 a 48 hs.";

function setMeta(attr, key, value) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) return tag?.remove();
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

const shorten = (text, max = 160) => {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

/**
 * Título, descripción y vista previa de cada página para Google y redes.
 * - title: se le suma " | Dulcinard Tucumán".
 * - noIndex: páginas privadas (carrito, perfil, panel) que no deben salir en Google.
 * - jsonLd: datos estructurados (negocio, producto) que lee Google.
 */
export function Seo({ title, description, image, noIndex = false, jsonLd }) {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = shorten(description || DEFAULT_DESCRIPTION);
  const url = `${window.location.origin}${pathname}`;

  useEffect(() => {
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    if (image) setMeta("property", "og:image", image);
    setCanonical(url);
  }, [fullTitle, desc, url, image, noIndex]);

  if (!jsonLd) return null;
  // Google lee estos datos aunque estén en el cuerpo de la página.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />;
}
