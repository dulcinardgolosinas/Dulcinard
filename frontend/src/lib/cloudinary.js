// URLs optimizadas de Cloudinary: formato automático (WebP/AVIF según el
// navegador), calidad automática y el ancho justo para cada pantalla. Las
// imágenes que no son de Cloudinary se devuelven tal cual.

const UPLOAD_SEGMENT = "/image/upload/";

export function cldUrl(url, { width, height, crop = "limit" } = {}) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes(UPLOAD_SEGMENT)) return url;
  const parts = ["f_auto", "q_auto", width && `w_${Math.round(width)}`, height && `h_${Math.round(height)}`, (width || height) && `c_${crop}`];
  const transform = parts.filter(Boolean).join(",");
  return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transform}/`);
}

/** srcSet para <img>: el navegador elige el ancho según la pantalla. */
export function cldSrcSet(url, widths, options = {}) {
  if (!url?.includes("res.cloudinary.com")) return undefined;
  return widths.map((w) => `${cldUrl(url, { ...options, width: w })} ${w}w`).join(", ");
}
