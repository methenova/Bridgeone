import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, MessageSquare, IndianRupee, ShoppingBag } from "lucide-react";
import useSellerShop from "../hooks/useSellerShop";
import { getSellerOrderItems } from "../services/order.service";
import ProductSkeleton from "../components/ProductSkeleton";

export default function CustomersPage() {
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useSellerShop();
  const [searchTerm, setSearchTerm] = useState("");

  // Query order items for this shop
  const { data: orderItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["seller-order-items", shop?.id],
    queryFn: () => getSellerOrderItems(shop.id),
    enabled: !!shop?.id,
  });

  // Aggregate customer metrics
  const customerList = useMemo(() => {
    if (!orderItems.length) return [];

    const agg = {};
    orderItems.forEach((item) => {
      const order = item.orders;
      if (!order) return;
      const profile = order.profiles;
      const customerId = order.user_id;

      if (!customerId) return;

      const itemTotal = (item.price || 0) * (item.quantity || 1);

      if (!agg[customerId]) {
        agg[customerId] = {
          id: customerId,
          name: profile?.full_name || "Unknown Customer",
          email: profile?.email || "No Email",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: order.created_at,
          orderIds: new Set(),
        };
      }

      // Add order id to set to aggregate unique orders count
      agg[customerId].orderIds.add(order.id);
      agg[customerId].totalSpent += itemTotal;

      // Update last order date if this one is newer
      if (new Date(order.created_at) > new Date(agg[customerId].lastOrderDate)) {
        agg[customerId].lastOrderDate = order.created_at;
      }
    });

    return Object.values(agg).map((cust) => ({
      ...cust,
      ordersCount: cust.orderIds.size,
    }));
  }, [orderItems]);

  // Filtered customers based on search term
  const filteredCustomers = useMemo(() => {
    return customerList.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerList, searchTerm]);

  // Metrics
  const stats = useMemo(() => {
    const totalCustomers = customerList.length;
    const totalSales = customerList.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = customerList.reduce((sum, c) => sum + c.ordersCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalCustomers,
      totalSales,
      avgOrderValue,
    };
  }, [customerList]);

  const isLoading = shopLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-800" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-900" />
          ))}
        </div>
        <ProductSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="mt-1 text-slate-400">Track and manage customer profiles and purchase history.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Customers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400 font-medium">Total Customers</span>
            <h3 className="text-3xl font-bold mt-2">{stats.totalCustomers}</h3>
            <p className="text-xs text-slate-500 mt-1">Unique shoppers</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400 font-medium">Shop Revenue</span>
            <h3 className="text-3xl font-bold mt-2">₹{stats.totalSales.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-slate-500 mt-1">Sum of items purchased</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        {/* Avg LTV */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400 font-medium">Avg. Order Value</span>
            <h3 className="text-3xl font-bold mt-2">₹{Math.round(stats.avgOrderValue).toLocaleString("en-IN")}</h3>
            <p className="text-xs text-slate-500 mt-1">Per transaction average</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Customers List Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Search Header */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="text-sm text-slate-400">
            Showing <span className="font-semibold text-white">{filteredCustomers.length}</span> of{" "}
            <span className="font-semibold text-white">{customerList.length}</span> customers
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">No Customers Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              {searchTerm ? "No customers match your search criteria." : "When customers buy your products, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Total Orders</th>
                  <th className="px-6 py-4">Total Spent</th>
                  <th className="px-6 py-4">Last Purchase Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-850/20 transition-colors">
                    {/* Profile */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{customer.name}</div>
                        <div className="text-xs text-slate-500">{customer.email}</div>
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="px-6 py-4 text-slate-300">
                      {customer.ordersCount} {customer.ordersCount === 1 ? "order" : "orders"}
                    </td>

                    {/* Total Spent */}
                    <td className="px-6 py-4 font-semibold text-emerald-400">
                      ₹{customer.totalSpent.toLocaleString("en-IN")}
                    </td>

                    {/* Last Purchase */}
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(customer.lastOrderDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/seller/chat?userId=${customer.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                        Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
