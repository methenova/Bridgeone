import { useQuery } from "@tanstack/react-query";

import {
  getMarketplaceProducts,
  getProductById,
  getRelatedProducts,
  getFeaturedProducts,
  getPublicCategories,
} from "@/services/marketplace/product.service";

// ─────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────
export const marketplaceProductKeys = {
  all: ["marketplace-products"],
  lists: () => [...marketplaceProductKeys.all, "list"],
  list: (filters) => [...marketplaceProductKeys.lists(), filters],
  detail: (id) => [...marketplaceProductKeys.all, "detail", id],
  related: (id, categoryId) => [...marketplaceProductKeys.all, "related", id, categoryId],
  featured: (limit) => [...marketplaceProductKeys.all, "featured", limit],
  categories: () => ["public-categories"],
};

// ─────────────────────────────────────────────────────────────
// GET MARKETPLACE PRODUCTS
// ─────────────────────────────────────────────────────────────
export function useMarketplaceProducts(filters = {}) {
  return useQuery({
    queryKey: marketplaceProductKeys.list(filters),
    queryFn: () => getMarketplaceProducts(filters),
    placeholderData: (prev) => prev,
  });
}

// ─────────────────────────────────────────────────────────────
// GET PRODUCT DETAIL
// ─────────────────────────────────────────────────────────────
export function useProductDetail(productId) {
  return useQuery({
    queryKey: marketplaceProductKeys.detail(productId),
    queryFn: () => getProductById(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ─────────────────────────────────────────────────────────────
// GET RELATED PRODUCTS
// ─────────────────────────────────────────────────────────────
export function useRelatedProducts(productId, categoryId) {
  return useQuery({
    queryKey: marketplaceProductKeys.related(productId, categoryId),
    queryFn: () => getRelatedProducts(productId, categoryId, 8),
    enabled: !!(productId && categoryId),
    staleTime: 1000 * 60 * 5,
  });
}

// ─────────────────────────────────────────────────────────────
// GET FEATURED PRODUCTS
// ─────────────────────────────────────────────────────────────
export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: marketplaceProductKeys.featured(limit),
    queryFn: () => getFeaturedProducts(limit),
    staleTime: 1000 * 60 * 5,
  });
}

// ─────────────────────────────────────────────────────────────
// GET CATEGORIES
// ─────────────────────────────────────────────────────────────
export function usePublicCategories() {
  return useQuery({
    queryKey: marketplaceProductKeys.categories(),
    queryFn: getPublicCategories,
    staleTime: 1000 * 60 * 15, // 15 min
  });
}
