import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────
// Wishlist Store
// Optimistic local state — synced with Supabase via hooks
// ─────────────────────────────────────────────────────────────
const useWishlistStore = create(
  persist(
    (set, get) => ({
      productIds: [], // string[]

      setWishlist: (ids) => set({ productIds: ids }),

      addToWishlist: (productId) => {
        if (!get().productIds.includes(productId)) {
          set({ productIds: [...get().productIds, productId] });
        }
      },

      removeFromWishlist: (productId) => {
        set({ productIds: get().productIds.filter((id) => id !== productId) });
      },

      isWishlisted: (productId) => get().productIds.includes(productId),

      clearWishlist: () => set({ productIds: [] }),
    }),
    {
      name: "bridgeone-wishlist",
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);

export default useWishlistStore;
