import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useSiteConfigStore } from "../../store/siteConfigStore";

const HIDDEN_ROUTES = ["/login", "/registro"];

export function WhatsappButton() {
  const config = useSiteConfigStore((s) => s.config);
  const location = useLocation();
  const number = config?.whatsappNumber || "3814091213";
  const message = config?.whatsappMessage || "¡Hola! Quiero hacer un pedido a Dulcinard.";
  const href = `https://wa.me/549381${number.replace(/\D/g, "").slice(-7)}?text=${encodeURIComponent(message)}`;

  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
      className="fixed bottom-20 right-5 z-50 md:bottom-6 md:right-6"
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="group relative"
      >
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 md:block">
          ¡Escribinos!
        </span>

        <span className="absolute inset-0 animate-ping rounded-full bg-brand-600 opacity-60" />
        <span className="absolute inset-0 rounded-full bg-brand-600 blur-md opacity-50" />

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_10px_32px_-6px_rgba(184,24,48,0.75)] transition-all duration-300 hover:scale-110 hover:bg-brand-700 hover:shadow-[0_16px_44px_-6px_rgba(184,24,48,0.9)] active:scale-95"
        >
          <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current">
            <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.386.694 4.61 1.897 6.484L4 29l7.72-1.858A11.9 11.9 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.6a9.55 9.55 0 0 1-4.87-1.33l-.35-.207-4.58 1.102 1.13-4.463-.23-.366A9.55 9.55 0 0 1 5.4 15c0-5.85 4.755-10.6 10.604-10.6C21.85 4.4 26.6 9.15 26.6 15S21.85 25.6 16.004 25.6Zm5.79-7.93c-.317-.159-1.877-.926-2.168-1.032-.29-.106-.502-.159-.714.16-.211.317-.819 1.031-1.004 1.243-.185.211-.37.238-.687.08-.317-.16-1.338-.494-2.548-1.575-.942-.84-1.578-1.878-1.763-2.196-.185-.317-.02-.489.14-.647.143-.142.318-.37.476-.556.159-.185.212-.318.318-.529.106-.212.053-.397-.026-.556-.08-.16-.714-1.723-.978-2.36-.257-.618-.519-.534-.714-.544l-.608-.01c-.212 0-.556.079-.847.397-.29.317-1.11 1.084-1.11 2.645s1.136 3.068 1.294 3.28c.159.211 2.236 3.414 5.42 4.788.757.327 1.348.522 1.809.668.76.242 1.452.208 1.999.126.61-.091 1.877-.767 2.142-1.508.264-.741.264-1.376.185-1.508-.08-.132-.29-.211-.607-.37Z" />
          </svg>
        </a>
      </motion.div>
    </motion.div>
  );
}
