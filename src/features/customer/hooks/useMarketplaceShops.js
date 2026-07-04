import { useQuery } from "@tanstack/react-query";
import { getShops, getShop, getFeaturedShops } from "@/services/shop/shop.service";

export const shopKeys = {
  all: ["shops"],
  lists: () => [...shopKeys.all, "list"],
  list: (filters) => [...shopKeys.lists(), filters],
  detail: (id) => [...shopKeys.all, "detail", id],
  featured: (limit) => [...shopKeys.all, "featured", limit],
};

export function useMarketplaceShops(filters = {}) {
  return useQuery({
    queryKey: shopKeys.list(filters),
    queryFn: () => getShops(filters),
    placeholderData: (prev) => prev,
  });
}

export function useShopDetail(shopId) {
  return useQuery({
    queryKey: shopKeys.detail(shopId),
    queryFn: () => getShop(shopId),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedShops(limit = 6) {
  return useQuery({
    queryKey: shopKeys.featured(limit),
    queryFn: () => getFeaturedShops(limit),
    staleTime: 1000 * 60 * 5,
  });
}
