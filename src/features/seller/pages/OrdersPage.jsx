import { useState, useMemo } from "react";
import { Search, ShoppingBag } from "lucide-react";

import useSellerShop from "../hooks/useSellerShop";
import { useSellerOrders } from "../hooks/useSellerOrders";

import OrderStatusTabs from "../components/OrderStatusTabs";
import SellerOrderRow from "../components/SellerOrderRow";
import OrderDetailsDrawer from "../components/OrderDetailsDrawer";
import InvoiceModal from "../components/InvoiceModal";
import ProductSkeleton from "../components/ProductSkeleton";

export default function OrdersPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

  const { data: orders = [], isLoading, isFetching } = useSellerOrders(shopId);

  // Filter States
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Grouped and Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (activeTab !== "all" && order.status !== activeTab) {
        return false;
      }

      // 2. Search Query (Customer Name, Email, Order ID, Product Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesName = order.customer?.full_name?.toLowerCase().includes(query);
        const matchesEmail = order.customer?.email?.toLowerCase().includes(query);
        const matchesProduct = order.items.some((item) =>
          item.product?.name?.toLowerCase().includes(query)
        );

        if (!matchesId && !matchesName && !matchesEmail && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  function handleViewDetails(order) {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }

  function handlePrintInvoice(order) {
    setSelectedOrder(order);
    setInvoiceOpen(true);
  }

  if (shopLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center pb-4">
          <div className="h-6 w-32 bg-slate-100 rounded-md" />
          <div className="h-10 w-24 bg-slate-100 rounded-md" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
          <div className="h-10 bg-slate-50 rounded-xl" />
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-12 bg-slate-50/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 font-semibold">
          ⚠️
        </div>
        <h3 className="text-xl font-semibold text-slate-900">No Shop Found</h3>
        <p className="mt-2 text-slate-500 max-w-sm">
          Please create a shop in the "My Shop" section first to handle order fulfillment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-slate-500">
          Manage, fulfill, and track customer purchases for {shop.name}
        </p>
      </div>

      {/* Tabs */}
      <OrderStatusTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        orders={orders}
      />

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer, product..." 
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* Orders List Table */}
      {isLoading ? (
        <ProductSkeleton rows={6} />
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-slate-200 bg-slate-50 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No orders found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery
              ? "No orders match your search criteria."
              : `There are no ${activeTab !== "all" ? activeTab : ""} orders yet.`}
          </p>
        </div>
      ) : (
        <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity ${
          isFetching && !isLoading ? "opacity-75" : ""
        }`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-5 align-middle">Order ID</th>
                  <th className="px-6 py-5 align-middle">Date</th>
                  <th className="px-6 py-5 align-middle">Customer</th>
                  <th className="px-6 py-5 align-middle">Products</th>
                  <th className="px-6 py-5 align-middle">Value</th>
                  <th className="px-6 py-5 align-middle">Status</th>
                  <th className="px-6 py-5 align-middle text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
                {filteredOrders.map((order) => (
                  <SellerOrderRow
                    key={order.id}
                    order={order}
                    onView={handleViewDetails}
                    onPrintInvoice={handlePrintInvoice}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        isOpen={drawerOpen}
        order={selectedOrder}
        onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
        onPrintInvoice={handlePrintInvoice}
      />

      {/* Invoice Generation Modal */}
      <InvoiceModal
        isOpen={invoiceOpen}
        order={selectedOrder}
        shop={shop}
        onClose={() => { setInvoiceOpen(false); setSelectedOrder(null); }}
      />
    </div>
  );
}
