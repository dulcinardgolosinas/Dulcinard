import { useSiteConfigStore } from "../../store/siteConfigStore";

const FALLBACK_LOGO = "https://res.cloudinary.com/dabikk5ei/image/upload/v1785899452/dulcinard/branding/rfwcpj2aorrjjlbtyzvz.png";

const sides = {
  left: "-left-24 -rotate-6 sm:-left-20",
  right: "-right-24 rotate-6 sm:-right-16"
};

// Marca de agua decorativa del logo, muy sutil, para darle personalidad a
// las páginas institucionales sin restar legibilidad al contenido.
export function LogoWatermark({ side = "left" }) {
  const config = useSiteConfigStore((s) => s.config);
  const logoUrl = config?.logo?.url || FALLBACK_LOGO;

  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 w-[420px] -translate-y-1/2 opacity-[0.05] sm:w-[520px] md:w-[620px] ${sides[side]}`}
    />
  );
}
