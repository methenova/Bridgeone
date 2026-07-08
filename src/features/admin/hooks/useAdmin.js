import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getAdminStats,
  getAdminUsers,
  updateProfileRole,
  getAdminShops,
  toggleShopStatus,
  updateShopPlan,
  getAdminProducts,
  toggleProductFeatured,
  toggleProductActive,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminOrders,
  getAdminCalls,
  getLiveRooms,
  deleteCallLog,
  getAdminCallbacks,
  updateCallbackStatus,
  deleteCallback,
} from "../services/admin.service";

const adminKeys = {
  all: ["admin"],
  stats: () => [...adminKeys.all, "stats"],
  users: () => [...adminKeys.all, "users"],
  shops: () => [...adminKeys.all, "shops"],
  products: () => [...adminKeys.all, "products"],
  categories: () => [...adminKeys.all, "categories"],
  orders: () => [...adminKeys.all, "orders"],
  calls: () => [...adminKeys.all, "calls"],
  liveRooms: () => [...adminKeys.all, "liveRooms"],
  callbacks: () => [...adminKeys.all, "callbacks"],
};

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getAdminStats,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: getAdminUsers,
  });
}

export function useUpdateProfileRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => updateProfileRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success("User role updated successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to update role"),
  });
}

export function useAdminShops() {
  return useQuery({
    queryKey: adminKeys.shops(),
    queryFn: getAdminShops,
  });
}

export function useToggleShopStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, isActive }) => toggleShopStatus(shopId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.shops() });
      toast.success("Shop status updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  });
}

export function useUpdateShopPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, planName }) => updateShopPlan(shopId, planName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.shops() });
      toast.success("Shop subscription plan updated successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to update subscription plan"),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: adminKeys.products(),
    queryFn: getAdminProducts,
  });
}

export function useToggleProductFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, isFeatured }) => toggleProductFeatured(productId, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      toast.success("Product status updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, isActive }) => toggleProductActive(productId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      toast.success("Product status updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: getAdminCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      toast.success("Category created successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to create category"),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      toast.success("Category updated successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to update category"),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      toast.success("Category deleted");
    },
    onError: (err) => toast.error(err.message || "Failed to delete category"),
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: adminKeys.orders(),
    queryFn: getAdminOrders,
  });
}

export function useAdminCalls() {
  return useQuery({
    queryKey: adminKeys.calls(),
    queryFn: getAdminCalls,
  });
}

export function useLiveRooms() {
  return useQuery({
    queryKey: adminKeys.liveRooms(),
    queryFn: getLiveRooms,
    refetchInterval: 5000,
  });
}

export function useDeleteCallLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCallLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.calls() });
      toast.success("Call log deleted successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to delete call log"),
  });
}

export function useAdminCallbacks() {
  return useQuery({
    queryKey: adminKeys.callbacks(),
    queryFn: getAdminCallbacks,
  });
}

export function useUpdateCallbackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ callbackId, status }) => updateCallbackStatus(callbackId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.callbacks() });
      toast.success("Callback status updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update callback status"),
  });
}

export function useDeleteCallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCallback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.callbacks() });
      toast.success("Callback request deleted");
    },
    onError: (err) => toast.error(err.message || "Failed to delete callback"),
  });
}
