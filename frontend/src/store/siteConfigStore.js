import { create } from "zustand";
import { api } from "../lib/api";

export const useSiteConfigStore = create((set, get) => ({
  config: null,
  loading: false,

  fetchConfig: async () => {
    if (get().config || get().loading) return;
    set({ loading: true });
    try {
      const { data } = await api.get("/site-config");
      set({ config: data, loading: false });
    } catch {
      set({ loading: false });
    }
  }
}));
