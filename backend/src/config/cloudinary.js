import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Estructura de carpetas en Cloudinary:
//   dulcinard/branding    -> logo, favicon, imágenes institucionales
//   dulcinard/products    -> imágenes de productos
//   dulcinard/categories  -> imagen de portada por categoría
//   dulcinard/promotions  -> banners de promociones activas
//   dulcinard/providers   -> logos de marcas/proveedores
//   dulcinard/heroes      -> fondos de hero por página
export const CLOUDINARY_FOLDERS = {
  branding: "dulcinard/branding",
  products: "dulcinard/products",
  categories: "dulcinard/categories",
  promotions: "dulcinard/promotions",
  providers: "dulcinard/providers",
  heroes: "dulcinard/heroes"
};

export default cloudinary;
