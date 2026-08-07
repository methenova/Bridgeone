import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getPopins,
  createPopin,
  updatePopin,
  deletePopin,
  togglePopinStatus,
} from "../services/popin.service";

export const popinKeys = {
  all: ["popins"],
  list: (shopId) => [...popinKeys.all, "list", shopId],
};

export function usePopins(shopId) {
  return useQuery({
    queryKey: popinKeys.list(shopId),
    queryFn: () => getPopins(shopId),
    enabled: !!shopId,
  });
}

export function useCreatePopin(shopId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => createPopin(shopId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popinKeys.list(shopId) });
      toast.success("Proactive popin rule created!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create popin");
    },
  });
}

export function useUpdatePopin(shopId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ popinId, values }) => updatePopin(popinId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popinKeys.list(shopId) });
      toast.success("Proactive popin updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update popin");
    },
  });
}

export function useDeletePopin(shopId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePopin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popinKeys.list(shopId) });
      toast.success("Popin rule deleted!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete popin");
    },
  });
}

export function useTogglePopinStatus(shopId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ popinId, is_active }) => togglePopinStatus(popinId, is_active),
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: popinKeys.list(shopId) });
      toast.success(`Popin rule ${is_active ? "activated" : "deactivated"}!`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
}
