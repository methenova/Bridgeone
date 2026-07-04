import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/services/marketplace/wishlist.service";

import useWishlistStore from "@/store/wishlistStore";
import { useAuthContext } from "@/context/AuthContext";

const wishlistKeys = {
  all: ["wishlist"],
  list: (userId) => [...wishlistKeys.all, userId],
};

// ─────────────────────────────────────────────────────────────
// GET WISHLIST
// ─────────────────────────────────────────────────────────────
export function useWishlist() {
  const { user } = useAuthContext();
  const setWishlist = useWishlistStore((s) => s.setWishlist);

  return useQuery({
    queryKey: wishlistKeys.list(user?.id),
    queryFn: async () => {
      const data = await getWishlist(user.id);
      // Sync IDs to Zustand store for instant isWishlisted checks
      setWishlist(data.map((w) => w.product_id));
      return data;
    },
    enabled: !!user,
  });
}

// ─────────────────────────────────────────────────────────────
// TOGGLE WISHLIST (add / remove)
// ─────────────────────────────────────────────────────────────
export function useToggleWishlist() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { addToWishlist: storeAdd, removeFromWishlist: storeRemove, isWishlisted } =
    useWishlistStore();

  return useMutation({
    mutationFn: async (productId) => {
      if (!user) throw new Error("Please login to save products");

      if (isWishlisted(productId)) {
        storeRemove(productId); // optimistic
        await removeFromWishlist(user.id, productId);
        return { action: "removed", productId };
      } else {
        storeAdd(productId); // optimistic
        await addToWishlist(user.id, productId);
        return { action: "added", productId };
      }
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list(user?.id) });
      toast.success(action === "added" ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update wishlist");
    },
  });
}
