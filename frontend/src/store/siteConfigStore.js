import { create } from "zustand";
import { api } from "../lib/api";

function applyFavicon(url) {
  if (!url) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

export const useSiteConfigStore = create((set, get) => ({
  config: null,
  loading: false,

  fetchConfig: async () => {
    if (get().config || get().loading) return;
    set({ loading: true });
    try {
      const { data } = await api.get("/site-config");
      set({ config: data, loading: false });
      // El logo de la marca (Cloudinary) también se usa como favicon.
      applyFavicon(data?.logo?.url);
    } catch {
      set({ loading: false });
    }
  },

  // Usado por el panel admin para reflejar cambios (logo, datos generales)
  // en el resto de la app al instante, sin esperar a un refetch.
  setConfig: (data) => {
    set({ config: data });
    applyFavicon(data?.logo?.url);
  }
}));
