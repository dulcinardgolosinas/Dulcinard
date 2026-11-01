// Navegación compartida por el menú y la página principal.

/** Baja suavemente hasta la sección de productos de la página principal. */
export function scrollToProducts() {
  document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Adónde lleva el botón "Comprar" de cada foto del carrusel (lo elige el admin). */
export function slideHref(slide) {
  if (slide.linkType === "product" && slide.product?.slug && slide.product.active !== false) return `/producto/${slide.product.slug}`;
  if (slide.linkType === "category" && slide.category?._id && slide.category.active !== false) {
    return `/catalogo?category=${slide.category._id}`;
  }
  return "/catalogo";
}
