// Orders table removed — marketplace module dropped.
// These hooks are stubs to prevent import errors in OrdersPage.

export const sellerOrderKeys = {
  all: ["seller-orders"],
  list: (shopId) => [...sellerOrderKeys.all, "list", shopId],
};

export function useSellerOrders(_shopId) {
  return { data: [], isLoading: false, isFetching: false };
}

export function useUpdateOrderStatus() {
  return { mutate: () => {}, isPending: false };
}
