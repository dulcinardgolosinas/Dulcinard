import { useEffect, useState } from "react";

/**
 * Paginación de una lista que ya está cargada entera (categorías, zonas,
 * sucursales, promociones). Devuelve los datos para el componente <Pagination>.
 * `start` es la posición del primer elemento de la página (útil si se necesita
 * el índice real, ej: en un formulario con varias filas).
 */
export function usePagedList(items, size = 10) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);

  // Si se borran elementos y la página queda vacía, se vuelve a la última que tiene.
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const start = (current - 1) * size;
  return { page: current, pages, total, limit: size, start, items: items.slice(start, start + size), setPage };
}
