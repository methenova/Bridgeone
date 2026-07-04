import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────
// Cart Store — persisted to localStorage
// ─────────────────────────────────────────────────────────────
const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, quantity }]

      // ── Add item (or increment qty if already in cart) ───────
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },

      // ── Remove item ──────────────────────────────────────────
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      // ── Update quantity (removes if qty reaches 0) ───────────
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      // ── Clear cart ───────────────────────────────────────────
      clearCart: () => set({ items: [] }),

      // ── Computed ─────────────────────────────────────────────
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce((sum, i) => {
          const price =
            i.product.discount_price
              ? Number(i.product.discount_price)
              : Number(i.product.price);
          return sum + price * i.quantity;
        }, 0);
      },

      isInCart: (productId) =>
        get().items.some((i) => i.product.id === productId),

      getQuantity: (productId) =>
        get().items.find((i) => i.product.id === productId)?.quantity ?? 0,
    }),
    {
      name: "bridgeone-cart",
      // Only persist items
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
