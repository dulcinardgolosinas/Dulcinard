import { usePageHeroStore } from "../../store/pageHeroStore";

const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

// Fondo por defecto si la página todavía no tiene una imagen cargada desde el admin.
const DEFAULT_BG_IMAGE = "https://res.cloudinary.com/nu4m5rh8/image/upload/v1793559589/hero-rojo_zpfbvv.jpg";

// Fondo compartido por los hero oscuros (Contacto, Quiénes somos, Envíos):
// foto de fondo (cargada desde el admin, por página) con un velo oscuro suave
// solo del lado del texto, para que la foto real se vea tal cual sin quedar
// teñida de rojo. Las imágenes se piden una sola vez al iniciar la app
// (ver pageHeroStore) para que al navegar entre páginas no haya un flash
// del fondo por defecto mientras se vuelve a pedir la imagen.
export function HeroBackdrop({ page }) {
  const bgImage = usePageHeroStore((s) => s.images[page]) || DEFAULT_BG_IMAGE;

  return (
    <>
      <div className="absolute inset-0 -z-30 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 -z-20 bg-ink-950/35" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-ink-950/90 via-ink-950/45 to-ink-950/15" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />

      <div
        className="absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </>
  );
}
