import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  MessageSquare, 
  IndianRupee, 
  ShoppingBag, 
  X, 
  Clock, 
  Video, 
  UserCheck, 
  Star, 
  Loader2, 
  Save, 
  ListFilter,
  Activity,
  CalendarCheck
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";
import { getSellerOrderItems } from "../services/order.service";

export default function CustomersPage() {
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [spentFilter, setSpentFilter] = useState("all"); // "all" | "high" (>5000) | "mid" (>1000)
  
  // Selected Customer CRM drawer state
  const [selectedCust, setSelectedCust] = useState(null);
  const [activeCrmTab, setActiveCrmTab] = useState("timeline"); // "timeline" | "calls" | "orders" | "notes"
  const [crmNotes, setCrmNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [agents, setAgents] = useState([]);
  const [customerCalls, setCustomerCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Chronological timeline states
  const [timelineItems, setTimelineItems] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Query order items for this shop
  const { data: orderItems = [], isLoading: itemsLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["seller-order-items", shopId],
    queryFn: () => getSellerOrderItems(shopId),
    enabled: !!shopId,
  });

  // Fetch agents list
  useEffect(() => {
    if (shopId) {
      supabase.from("shop_agents")
        .select("*, profiles(full_name)")
        .eq("shop_id", shopId)
        .then(({ data }) => {
          setAgents(data || []);
        });
    }
  }, [shopId]);

  // Fetch caller logs for the selected customer CRM profile
  useEffect(() => {
    if (!selectedCust) return;
    
    async function loadCustomerCalls() {
      try {
        setLoadingCalls(true);
        const { data, error } = await supabase
          .from("call_logs")
          .select("*")
          .eq("shop_id", shopId)
          .ilike("customer_name", `%${selectedCust.name}%`);

        if (error) throw error;
        setCustomerCalls(data || []);
      } catch (err) {
        console.warn("Failed to load customer calls log:", err);
      } finally {
        setLoadingCalls(false);
      }
    }
    loadCustomerCalls();
  }, [selectedCust, shopId]);

  // Load unified chronological history for the CRM profile
  async function loadCustomerTimeline(cust) {
    if (!shopId || !cust) return;
    try {
      setLoadingTimeline(true);
      const items = [];

      // 1. Fetch website visits & products viewed (from visitor_sessions)
      const { data: visits } = await supabase
        .from("visitor_sessions")
        .select("*")
        .eq("shop_id", shopId)
        .eq("profile_id", cust.id);

      visits?.forEach(v => {
        items.push({
          type: "visit",
          title: "Website Visit",
          body: `Visited page: ${v.current_page || "/"}`,
          time: new Date(v.created_at || v.updated_at),
        });

        const viewed = v.viewed_products || [];
        viewed.forEach(prod => {
          items.push({
            type: "product_view",
            title: "Product Viewed",
            body: `Viewed product: ${prod.name || prod}`,
            time: new Date(v.updated_at || v.created_at),
          });
        });
      });

      // 2. Fetch video calls (from call_logs)
      const { data: calls } = await supabase
        .from("call_logs")
        .select("*")
        .eq("shop_id", shopId)
        .or(`customer_email.eq.${cust.email},customer_name.eq.${cust.name}`);

      calls?.forEach(c => {
        items.push({
          type: "call",
          title: "Video Call Log",
          body: `Consultation call status: ${c.status || "completed"}. Duration: ${Math.round((c.duration || 0)/60)}m ${(c.duration || 0)%60}s`,
          time: new Date(c.created_at),
        });
      });

      // 3. Fetch checkout orders (from orders)
      const { data: orders } = await supabase
        .from("orders")
        .select("*, order_items!inner(*)")
        .eq("order_items.shop_id", shopId)
        .eq("user_id", cust.id);

      orders?.forEach(o => {
        items.push({
          type: "order",
          title: "Order Placed",
          body: `Invoice #${o.id.substring(0,8).toUpperCase()} placed. Total: ₹${Number(o.total_price || 0).toLocaleString()}`,
          time: new Date(o.created_at),
        });
      });

      // 4. Fetch callbacks (from callback_requests)
      const { data: callbacks } = await supabase
        .from("callback_requests")
        .select("*")
        .eq("shop_id", shopId)
        .or(`customer_email.eq.${cust.email},customer_name.eq.${cust.name}`);

      callbacks?.forEach(cb => {
        items.push({
          type: "callback",
          title: "Callback Requested",
          body: `Scheduled callback for: ${new Date(cb.scheduled_time).toLocaleString("en-IN")}. Status: ${cb.status || "pending"}`,
          time: new Date(cb.created_at),
        });
      });

      // 5. Notes / registration placeholders
      if (cust.notes) {
        items.push({
          type: "notes",
          title: "Profile Notes Updated",
          body: `Notes updated: ${cust.notes.substring(0, 100)}`,
          time: new Date(cust.lastOrderDate || Date.now() - 3600000),
        });
      }

      // Add profile creation/registration
      items.push({
        type: "registration",
        title: "CRM Contact Registered",
        body: `Created shopper profile for ${cust.name}`,
        time: new Date(cust.createdAt || Date.now() - 86400000),
      });

      // Sort chronological history descending (newest first)
      items.sort((a, b) => b.time - a.time);
      setTimelineItems(items);

    } catch (err) {
      console.warn("Failed to load customer timeline history:", err);
    } finally {
      setLoadingTimeline(false);
    }
  }

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
          phone: profile?.phone || "No phone",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: order.created_at,
          orderIds: new Set(),
          items: [],
          notes: profile?.notes || "",
          createdAt: profile?.created_at
        };
      }

      agg[customerId].orderIds.add(order.id);
      agg[customerId].totalSpent += itemTotal;
      agg[customerId].items.push(item);

      if (new Date(order.created_at) > new Date(agg[customerId].lastOrderDate)) {
        agg[customerId].lastOrderDate = order.created_at;
      }
    });

    return Object.values(agg).map((cust) => ({
      ...cust,
      ordersCount: cust.orderIds.size,
    }));
  }, [orderItems]);

  // Filtered CRM Customers
  const filteredCustomers = useMemo(() => {
    return customerList.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpent = 
        spentFilter === "all" ||
        (spentFilter === "high" && c.totalSpent > 5000) ||
        (spentFilter === "mid" && c.totalSpent > 1000);

      return matchesSearch && matchesSpent;
    });
  }, [customerList, searchTerm, spentFilter]);

  // Aggregated scorecards
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

  // Save CRM notes to database profile
  async function handleSaveNotes() {
    if (!selectedCust || savingNotes) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notes: crmNotes })
        .eq("id", selectedCust.id);

      if (error) throw error;
      toast.success("CRM profile notes updated successfully!");
      
      // Update local state
      setSelectedCust(prev => ({ ...prev, notes: crmNotes }));
      refetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to update notes");
    } finally {
      setSavingNotes(false);
    }
  }

  // Open CRM Drawer
  function handleOpenCrm(cust) {
    setSelectedCust(cust);
    setCrmNotes(cust.notes || "");
    setAssignedAgent("");
    setFollowUpDate("");
    setActiveCrmTab("timeline");
    loadCustomerTimeline(cust);
  }

  const isLoading = shopLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-slate-50" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Customer CRM</h1>
        <p className="mt-1 text-xs text-slate-500">Track and manage customer communications timelines, checkout invoices, notes, and WebRTC calls logs.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total CRM Contacts</span>
            <h3 className="text-2xl font-black mt-2">{stats.totalCustomers}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Unique platform shoppers</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accumulated Purchases</span>
            <h3 className="text-2xl font-black mt-2">₹{stats.totalSales.toLocaleString("en-IN")}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Sum of checkout totals</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 font-semibold flex items-center justify-center shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Average Customer LTV</span>
            <h3 className="text-2xl font-black mt-2">₹{Math.round(stats.avgOrderValue).toLocaleString("en-IN")}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Assisted sales flow average</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-purple-50 border border-purple-100/50 text-purple-650 font-semibold flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* CRM Customer List */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 overflow-hidden">
        
        {/* Filter bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          
          {/* Search inputs */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 self-start md:self-auto">
            {/* Spent filter */}
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-slate-500" />
              <span>Spent tier:</span>
              <select
                value={spentFilter}
                onChange={(e) => setSpentFilter(e.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-350 outline-none"
              >
                <option value="all">All value Tiers</option>
                <option value="high">High Value (&gt; ₹5,000)</option>
                <option value="mid">Mid Value (&gt; ₹1,000)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Customer Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 hover:bg-slate-50/50 transition-colors group">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Shopper Info</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Total Orders Count</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Total Value spent</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Last Checkout Date</th>
                <th className="text-right px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">CRM Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-slate-600">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/50 hover:bg-slate-50/50 transition-colors group">
                  
                  {/* Info details */}
                  <td className="px-6 py-5 align-middle">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">{cust.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{cust.email}</span>
                    </div>
                  </td>

                  {/* Orders */}
                  <td className="font-semibold text-slate-600 px-6 py-5 align-middle">
                    {cust.ordersCount} checkouts
                  </td>

                  {/* Spent */}
                  <td className="font-bold text-emerald-600 px-6 py-5 align-middle">
                    ₹{cust.totalSpent.toLocaleString("en-IN")}
                  </td>

                  {/* Date */}
                  <td className="text-slate-500 px-6 py-5 align-middle">
                    {new Date(cust.lastOrderDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>

                  {/* CRM details trigger */}
                  <td className="text-right px-6 py-5 align-middle">
                    <div className="flex justify-end gap-2.5">
                      <button
                          onClick={() => handleOpenCrm(cust)} className="inline-flex items-center gap-1 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 px-2.5 py-1.5 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-blue-600 font-semibold" />
                        CRM File
                      </button>

                      <button
                          onClick={() => navigate(`/seller/chat?userId=${cust.id}`)} className="inline-flex items-center gap-1 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 px-2.5 py-1.5 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        Chat
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* CRM SLIDE-OUT DRAWER */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out ${
        selectedCust ? "translate-x-0" : "translate-x-full"
      }`}>
        {selectedCust && (
          <div className="h-full flex flex-col justify-between">
            {/* Header info */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black text-slate-900">{selectedCust.name}</h2>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{selectedCust.email}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{selectedCust.phone}</span>
              </div>
              <button 
                onClick={() => setSelectedCust(null)} className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TAB SELECT */}
            <div className="grid grid-cols-4 border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-center">
              <button 
                onClick={() => setActiveCrmTab("timeline")}
                className={`py-3.5 border-b-2 transition-all ${activeCrmTab === "timeline" ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                Timeline
              </button>
              <button 
                onClick={() => setActiveCrmTab("calls")}
                className={`py-3.5 border-b-2 transition-all ${activeCrmTab === "calls" ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                Calls
              </button>
              <button 
                onClick={() => setActiveCrmTab("orders")}
                className={`py-3.5 border-b-2 transition-all ${activeCrmTab === "orders" ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                Orders
              </button>
              <button 
                onClick={() => setActiveCrmTab("notes")}
                className={`py-3.5 border-b-2 transition-all ${activeCrmTab === "notes" ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                CRM Notes
              </button>
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none text-xs">
              
              {/* TAB 1: TIMELINE */}
              {activeCrmTab === "timeline" && (
                <div className="space-y-4">
                  {loadingTimeline ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  ) : timelineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start relative pb-2 border-l border-slate-100 ml-3 pl-4">
                      {/* Left icon wrapper */}
                      <div className={`absolute -left-3 top-0 h-6 w-6 rounded-full bg-white border flex items-center justify-center shrink-0 ${
                        item.type === "visit" ? "border-sky-200 text-sky-600" :
                        item.type === "product_view" ? "border-amber-200 text-amber-600" :
                        item.type === "call" ? "border-indigo-200 text-indigo-600" :
                        item.type === "order" ? "border-emerald-200 text-emerald-600" :
                        item.type === "callback" ? "border-purple-200 text-purple-600" :
                        "border-slate-200 text-slate-500"
                      }`}>
                        {item.type === "visit" && <Activity className="h-3 w-3" />}
                        {item.type === "product_view" && <ShoppingBag className="h-3 w-3" />}
                        {item.type === "call" && <Video className="h-3 w-3" />}
                        {item.type === "order" && <IndianRupee className="h-3 w-3" />}
                        {item.type === "callback" && <CalendarCheck className="h-3 w-3" />}
                        {item.type !== "visit" && item.type !== "product_view" && item.type !== "call" && item.type !== "order" && item.type !== "callback" && <Clock className="h-3 w-3" />}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-xs">{item.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{item.body}</p>
                        <span className="text-[8px] text-slate-500 mt-0.5 block font-mono">
                          {item.time.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}

                  {timelineItems.length === 0 && !loadingTimeline && (
                    <p className="text-center text-slate-500 py-8 italic">No timeline logs recorded.</p>
                  )}
                </div>
              )}

              {/* TAB 2: CALL HISTORY */}
              {activeCrmTab === "calls" && (
                <div className="space-y-3">
                  {loadingCalls ? (
                    <div className="flex justify-center py-6 text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-blue-600 font-semibold" /></div>
                  ) : customerCalls.map(c => (
                    <div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 leading-normal">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-xs">WebRTC consultation call</h4>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          c.status === "completed" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Date: {new Date(c.created_at).toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Duration: {Math.round((c.duration || 0)/60)}m {(c.duration || 0)%60}s</p>
                    </div>
                  ))}
                  {!loadingCalls && customerCalls.length === 0 && (
                    <p className="text-[10px] text-slate-500 text-center py-6">No call logs found matching customer name.</p>
                  )}
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {activeCrmTab === "orders" && (
                <div className="space-y-3">
                  {selectedCust.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{item.product?.name || "Product"}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Qty: {item.quantity || 1} · Qty Price: ₹{Number(item.price).toLocaleString()}</p>
                      </div>
                      <span className="font-bold text-emerald-400">₹{(Number(item.price) * Number(item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: CRM NOTES */}
              {activeCrmTab === "notes" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CRM profile notes</label>
                    <textarea
                      rows={5}
                      value={crmNotes}
                      onChange={(e) => setCrmNotes(e.target.value)}
                      placeholder="Write notes about custom size options, brand requests..." className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-900 outline-none focus:border-blue-500 resize-none leading-relaxed text-[11px]"
                    />
                  </div>

                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-bold transition-all text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98] shadow-lg shadow-blue-500/10"
                  >
                    {savingNotes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Notes
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Schedule follow-ups panel */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4 text-xs font-semibold">
              
              {/* Follow-up date selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Schedule Follow-up appointment</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)} className="flex-1 rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 p-2 text-slate-900 outline-none text-xs"
                  />
                  <button
                    onClick={() => {
                      if (!followUpDate) return;
                      toast.success(`Follow-up schedule created for ${followUpDate}!`);
                      setFollowUpDate("");
                    }} className="px-4 py-2 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 hover:border-slate-300 rounded-2xl text-slate-900 text-[9px] uppercase tracking-wider cursor-pointer"
                  >
                    Schedule
                  </button>
                </div>
              </div>

              {/* Assign Agent select */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Assign Agent manager</label>
                <select
                  value={assignedAgent}
                  onChange={(e) => {
                    setAssignedAgent(e.target.value);
                    if (e.target.value) {
                      toast.success(`Customer CRM file assigned successfully!`);
                    }
                  }} className="w-full rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 p-2 text-slate-900 outline-none text-xs font-semibold"
                >
                  <option value="">-- Assign Agent Manager --</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.profiles?.full_name || "Team Member"}</option>
                  ))}
                </select>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
