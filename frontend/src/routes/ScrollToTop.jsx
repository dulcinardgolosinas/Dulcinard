import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// React Router (BrowserRouter) conserva la posición de scroll de la página
// anterior: al abrir un producto desde abajo del catálogo se aparecía en el
// footer. Cada navegación nueva arranca desde arriba; con "atrás/adelante"
// del navegador (POP) se respeta la posición que restaura el navegador.
// Solo mira el pathname: cambiar filtros de la URL (?q=...) no mueve la página.
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, navigationType]);

  return null;
}
