import { useState } from "react";
import { useAdminOrders } from "../hooks/useAdmin";
import { Search, ShoppingBag, Eye, User, MapPin } from "lucide-react";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";
import { Button } from "@/components/ui/button";

export default function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useAdminOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      order.id.toLowerCase().includes(query) ||
      order.profiles?.full_name?.toLowerCase().includes(query) ||
      order.profiles?.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-slate-500">View and track all platform checkouts.</p>
      </div>

      {/* Search query */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Order ID, customer name..."
          className="w-full rounded-xl border border-slate-200 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <ProductSkeleton rows={6} />
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center border border-slate-900 rounded-2xl bg-slate-900/10">
          <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-slate-600" />
          <p className="text-slate-500">No checkouts found matching queries.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-700 text-sm font-semibold">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date Placed</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/10 text-sm text-slate-600">
                {filteredOrders.map((o) => {
                  const customerName = o.profiles?.full_name || "—";
                  const orderDate = new Date(o.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {customerName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {orderDate}
                      </td>
                      <td className="px-6 py-4 text-slate-500 capitalize">
                        {o.payment_method}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{Number(o.total).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                          o.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : o.status === "cancelled"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => setSelectedOrder(o)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-900 text-slate-500 hover:text-white hover:border-slate-600 ml-auto"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simple Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Platform Checkout Details</h3>
                <span className="font-mono text-xs text-slate-500 mt-0.5">#{selectedOrder.id.toUpperCase()}</span>
              </div>
              <Button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4" /> Customer Info
              </h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-bold text-slate-900">{selectedOrder.profiles?.full_name || "—"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedOrder.profiles?.email || "—"}</p>
              </div>
            </div>

            {/* Address */}
            {selectedOrder.addresses && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">{selectedOrder.addresses.name}</p>
                  <p className="text-xs text-slate-500">{selectedOrder.addresses.phone}</p>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {selectedOrder.addresses.address_line1}
                    {selectedOrder.addresses.address_line2 ? `, ${selectedOrder.addresses.address_line2}` : ""}
                    <br />
                    {selectedOrder.addresses.city}, {selectedOrder.addresses.state} — {selectedOrder.addresses.pincode}
                  </p>
                </div>
              </div>
            )}

            {/* Items breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" /> Items Breakdown
              </h4>
              <div className="divide-y divide-slate-850 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-sm">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4">
                    <div>
                      <p className="font-semibold text-white">{item.products?.name || "—"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Vendor: {item.shops?.name || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{item.total.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.quantity} × ₹{(item.discount_price ? Number(item.discount_price) : Number(item.price)).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal summary */}
            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">₹{Number(selectedOrder.subtotal).toLocaleString()}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-₹{Number(selectedOrder.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-white">₹{Number(selectedOrder.delivery_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                <span>Total Paid</span>
                <span>₹{Number(selectedOrder.total).toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
