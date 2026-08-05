import { create } from "zustand";
import { persist } from "zustand/middleware";

// Carrito persistente (localStorage). Guarda una copia liviana del producto
// para poder pintar el carrito sin refetch; el total real siempre se
// recalcula en el backend al crear el pedido.
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { productId, name, slug, image, price, unit, minOrderQty, stock, quantity }
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product._id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product._id ? { ...i, quantity: i.quantity + quantity } : i
              ),
              isOpen: true
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product._id,
                name: product.name,
                slug: product.slug,
                image: product.images?.[0]?.url || "",
                price: product.price,
                unit: product.unit,
                minOrderQty: product.minOrderQty || 1,
                stock: product.stock,
                quantity: Math.max(quantity, product.minOrderQty || 1)
              }
            ],
            isOpen: true
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i))
            .filter((i) => i.quantity > 0)
        })),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0)
    }),
    { name: "dulcinard-cart" }
  )
);
