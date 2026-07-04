import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 20;

// ─────────────────────────────────────────────────────────────
// Recently Viewed Store — persisted, max 20 items
// ─────────────────────────────────────────────────────────────
const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      products: [], // [product, ...]

      addProduct: (product) => {
        const existing = get().products.filter((p) => p.id !== product.id);
        const updated = [product, ...existing].slice(0, MAX_ITEMS);
        set({ products: updated });
      },

      getRecent: (limit = 8) => get().products.slice(0, limit),

      clearRecent: () => set({ products: [] }),
    }),
    {
      name: "bridgeone-recently-viewed",
      partialize: (state) => ({ products: state.products }),
    }
  )
);

export default useRecentlyViewedStore;
