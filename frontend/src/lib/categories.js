import { api } from "./api";

// Las categorías las usan el menú y la página principal a la vez: se piden una
// sola vez por visita y se comparten.
let pending = null;

export function getCategories() {
  if (!pending) {
    pending = api
      .get("/categories")
      .then(({ data }) => data)
      .catch((err) => {
        pending = null; // si falla, el próximo intento vuelve a pedirlas
        throw err;
      });
  }
  return pending;
}
