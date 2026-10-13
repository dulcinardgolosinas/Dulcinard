import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Filtros + página de un listado guardados en la URL (?q=...&page=2), así
 * un link puede abrir el listado ya filtrado y "atrás" del navegador funciona.
 *
 * @param {Record<string, string>} defaults - valores por defecto; definilo
 *   FUERA del componente para que no cambie en cada render.
 * @returns {[Record<string, string>, (patch: Record<string, string|number>) => void]}
 *   Cambiar cualquier filtro vuelve a la página 1, salvo que el patch incluya `page`.
 */
export function useSearchFilters(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, searchParams.get(key) ?? value])),
    [defaults, searchParams]
  );

  const setFilters = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === "" || value == null || String(value) === String(defaults[key] ?? "")) next.delete(key);
            else next.set(key, String(value));
          }
          if (!("page" in patch)) next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [defaults, setSearchParams]
  );

  return [filters, setFilters];
}
