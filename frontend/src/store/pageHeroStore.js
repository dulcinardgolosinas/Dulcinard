import { create } from "zustand";
import { api } from "../lib/api";

const PAGES = ["quienes-somos", "envios", "contacto"];

// Fondos de hero por página, cargados una sola vez al iniciar la app
// para que al navegar entre páginas no haya un flash del fondo por defecto
// mientras se vuelve a pedir la imagen.
export const usePageHeroStore = create((set, get) => ({
  images: {},
  loaded: false,
  loading: false,

  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const results = await Promise.all(
        PAGES.map((page) =>
          api
            .get(`/page-heroes/${page}`)
            .then(({ data }) => [page, data?.backgroundImage?.url || null])
            .catch(() => [page, null])
        )
      );
      set({ images: Object.fromEntries(results), loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // Usado por el admin para reflejar cambios al instante sin esperar un refetch.
  setImage: (page, url) => {
    set((s) => ({ images: { ...s.images, [page]: url } }));
  }
}));
