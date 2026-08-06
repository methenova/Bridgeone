import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  fetchWidgetAnalytics,
  updateWidgetSettings,
  rotateWidgetToken,
} from "../services/widgetSettings.service";

export const widgetKeys = {
  all: ["widget"],
  analytics: (shopId) => [...widgetKeys.all, "analytics", shopId],
};

export function useWidgetAnalytics(shopId, activeSubTab) {
  return useQuery({
    queryKey: widgetKeys.analytics(shopId),
    queryFn: () => fetchWidgetAnalytics(shopId),
    enabled: !!shopId && activeSubTab === "analytics",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdateWidgetSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, payload }) => updateWidgetSettings(shopId, payload),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.analytics(shopId) });
      toast.success("Widget configuration updated successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update widget settings");
    },
  });
}

export function useRotateWidgetToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shopId) => rotateWidgetToken(shopId),
    onSuccess: () => {
      toast.success("Security token rotated. Embed code updated.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to rotate token");
    },
  });
}
