import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getSellerOrderItems, updateOrderStatus } from "../services/order.service";

export const sellerOrderKeys = {
  all: ["seller-orders"],
  list: (shopId) => [...sellerOrderKeys.all, "list", shopId],
};

/**
 * Hook to get grouped seller orders.
 */
export function useSellerOrders(shopId) {
  return useQuery({
    queryKey: sellerOrderKeys.list(shopId),
    queryFn: async () => {
      const items = await getSellerOrderItems(shopId);

      // Group items by order ID
      const ordersMap = {};

      items.forEach((item) => {
        const order = item.orders;
        if (!order) return;

        const orderId = order.id;

        if (!ordersMap[orderId]) {
          ordersMap[orderId] = {
            id: orderId,
            status: order.status,
            created_at: order.created_at,
            payment_method: order.payment_method,
            payment_id: order.payment_id,
            customer: order.profiles,
            address: order.addresses,
            shopSubtotal: 0,
            shopTotal: 0,
            items: [],
          };
        }

        const price = item.discount_price ? Number(item.discount_price) : Number(item.price);
        const itemTotal = price * item.quantity;

        ordersMap[orderId].shopSubtotal += itemTotal;
        ordersMap[orderId].shopTotal += itemTotal;

        ordersMap[orderId].items.push({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price,
          discountPrice: item.discount_price,
          total: itemTotal,
          product: item.products,
        });
      });

      // Convert map to sorted array
      return Object.values(ordersMap).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    },
    enabled: !!shopId,
  });
}

/**
 * Hook to update an order's status.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: (data, variables) => {
      // Invalidate all seller order lists
      queryClient.invalidateQueries({ queryKey: sellerOrderKeys.all });
      toast.success(`Order marked as ${variables.status}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update order status");
    },
  });
}
