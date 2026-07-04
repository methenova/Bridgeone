import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/config/supabase";
import { createOrder, getOrders, getOrder } from "@/services/marketplace/order.service";
import { useAuthContext } from "@/context/AuthContext";
import useCartStore from "@/store/cartStore";
import useNotificationStore from "@/store/notificationStore";

const orderKeys = {
  all: ["orders"],
  list: (userId) => [...orderKeys.all, "list", userId],
  detail: (id) => [...orderKeys.all, "detail", id],
};

export function useOrders() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: orderKeys.list(user?.id),
    queryFn: () => getOrders(user.id),
    enabled: !!user,
  });
}

export function useOrder(orderId) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (orderData) =>
      createOrder({ ...orderData, userId: user.id }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(user?.id) });
      clearCart();
      useNotificationStore.getState().addNotification(
        "Order Placed! 🎉",
        `Order #${order.id.slice(0, 8).toUpperCase()} was placed successfully.`,
        "order"
      );
      navigate(`/checkout/success?orderId=${order.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to place order. Please try again.");
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      useNotificationStore.getState().addNotification(
        "Order Cancelled 🚫",
        `Order #${order.id.slice(0, 8).toUpperCase()} has been cancelled.`,
        "order"
      );
      toast.success("Order cancelled successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });
}

export function useReturnOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      useNotificationStore.getState().addNotification(
        "Return Requested 📦",
        `Order #${order.id.slice(0, 8).toUpperCase()} return is active.`,
        "order"
      );
      toast.success("Return processed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit return request");
    },
  });
}
