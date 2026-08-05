import { motion } from "framer-motion";

const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const HERO_BG_IMAGE = "https://res.cloudinary.com/dabikk5ei/image/upload/v1785935416/hero-rojo_zpfbvv.jpg";

// Fondo compartido por los hero oscuros (Contacto, Quiénes somos, Envíos):
// foto de golosinas + overlay de marca + franja diagonal de acento + blobs de
// color en movimiento lento + grano sutil, en vez de un degradé plano.
export function HeroBackdrop() {
  return (
    <>
      <div className="absolute inset-0 -z-40 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }} />
      <div className="absolute inset-0 -z-30 bg-gradient-to-br from-ink-950/95 via-brand-900/90 to-brand-700/80" />

      <div className="absolute -right-1/4 top-0 -z-20 h-full w-2/3 rotate-12 bg-gradient-to-b from-accent-400/40 via-accent-500/15 to-transparent blur-3xl" />

      <motion.div
        className="absolute -left-32 -top-24 -z-20 h-[30rem] w-[30rem] rounded-full bg-accent-400/35 blur-[110px]"
        animate={{ x: [0, 40, 0], y: [0, 28, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 -bottom-28 -z-20 h-[26rem] w-[26rem] rounded-full bg-brand-400/35 blur-[110px]"
        animate={{ x: [0, -32, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div
        className="absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </>
  );
}
