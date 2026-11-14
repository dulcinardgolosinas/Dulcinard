import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Candy, X } from "lucide-react";
import { cldUrl } from "../../lib/cloudinary";

/**
 * Modal con todas las categorías en grilla (compu y tablet). En el celular las
 * categorías están en el menú de la solapa. Se cierra con la X, tocando afuera o con Esc.
 */
export function CategoriesModal({ open, categories, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // Mientras está abierto, la página de atrás no se desplaza.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink-950/50 p-4 pt-[10vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="categories-modal-title"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="categories-modal-title" className="font-display text-2xl font-bold text-ink-900">
                Categorías
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/catalogo?category=${c._id}`}
                  onClick={onClose}
                  className="group flex items-center gap-3 rounded-2xl border border-ink-100 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                    {c.image?.url ? (
                      <img src={cldUrl(c.image.url, { width: 120 })} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <Candy className="h-6 w-6 text-brand-600" />
                    )}
                  </span>
                  <span className="font-semibold leading-tight text-ink-800 group-hover:text-brand-600">{c.name}</span>
                </Link>
              ))}
            </div>

            <Link
              to="/catalogo"
              onClick={onClose}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              Ver todos los productos <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
