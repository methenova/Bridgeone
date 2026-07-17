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
  getAdminOrders,
  getAdminCalls,
  getLiveRooms,
  deleteCallLog,
  getAdminCallbacks,
  updateCallbackStatus,
  deleteCallback,
  getPlatformSettings,
  updatePlatformSettings,
  getSubscriptionPlans,
  updateSubscriptionPlan,
} from "../services/admin.service";

const adminKeys = {
  all: ["admin"],
  stats: () => [...adminKeys.all, "stats"],
  users: () => [...adminKeys.all, "users"],
  shops: () => [...adminKeys.all, "shops"],
  products: () => [...adminKeys.all, "products"],
  orders: () => [...adminKeys.all, "orders"],
  calls: () => [...adminKeys.all, "calls"],
  liveRooms: () => [...adminKeys.all, "liveRooms"],
  callbacks: () => [...adminKeys.all, "callbacks"],
  settings: () => [...adminKeys.all, "settings"],
  plans: () => [...adminKeys.all, "plans"],
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

export function usePlatformSettings() {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: getPlatformSettings,
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlatformSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
      toast.success("Platform configurations saved");
    },
    onError: (err) => toast.error(err.message || "Failed to update configurations"),
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: adminKeys.plans(),
    queryFn: getSubscriptionPlans,
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, updates }) => updateSubscriptionPlan(planId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
      toast.success("Subscription tier updated");
    },
    onError: (err) => toast.error(err.message || "Failed to update plan"),
  });
}
