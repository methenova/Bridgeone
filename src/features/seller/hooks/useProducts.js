import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateStatus,
  getCategories,
} from "../services/product.service";

// ─────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────
export const productKeys = {
  all: ["products"],
  lists: () => [...productKeys.all, "list"],
  list: (shopId, filters) => [...productKeys.lists(), shopId, filters],
  details: () => [...productKeys.all, "detail"],
  detail: (id) => [...productKeys.details(), id],
  categories: () => ["categories"],
};

// ─────────────────────────────────────────────────────────────
// GET PRODUCTS — paginated + filtered
// ─────────────────────────────────────────────────────────────
export function useProducts(shopId, filters = {}) {
  return useQuery({
    queryKey: productKeys.list(shopId, filters),
    queryFn: () => getProducts(shopId, filters),
    enabled: !!shopId,
    placeholderData: (prev) => prev, // keep previous data while fetching new page
  });
}

// ─────────────────────────────────────────────────────────────
// GET SINGLE PRODUCT
// ─────────────────────────────────────────────────────────────
export function useProduct(productId) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => getProduct(productId),
    enabled: !!productId,
  });
}

// ─────────────────────────────────────────────────────────────
// GET CATEGORIES
// ─────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes — categories rarely change
  });
}

// ─────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}

// ─────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }) => updateProduct(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(data.id),
      });
      toast.success("Product updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product");
    },
  });
}

// ─────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
}

// ─────────────────────────────────────────────────────────────
// BULK DELETE PRODUCTS
// ─────────────────────────────────────────────────────────────
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteProducts,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(`${ids.length} product${ids.length > 1 ? "s" : ""} deleted!`);
    },
    onError: (error) => {
      toast.error(error.message || "Bulk delete failed");
    },
  });
}

// ─────────────────────────────────────────────────────────────
// BULK UPDATE STATUS
// ─────────────────────────────────────────────────────────────
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, is_active }) => bulkUpdateStatus(ids, is_active),
    onSuccess: (_, { ids, is_active }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(
        `${ids.length} product${ids.length > 1 ? "s" : ""} ${is_active ? "activated" : "deactivated"}!`
      );
    },
    onError: (error) => {
      toast.error(error.message || "Bulk status update failed");
    },
  });
}
