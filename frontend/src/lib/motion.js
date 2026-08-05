// Variante de animación compartida por las páginas institucionales
// (Home, Contacto, Quiénes somos, Envíos) para mantener el mismo lenguaje
// visual: entrada con fade + desplazamiento hacia arriba, escalonada por índice.
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};
