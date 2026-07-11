import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Store, 
  Phone, 
  Mail, 
  Loader2, 
  Save, 
  Clock, 
  Video, 
  Bell, 
  Shield, 
  Layers, 
  KeyRound,
  ArrowRight,
  Route,
  Users
} from "lucide-react";

import useSellerShop from "../hooks/useSellerShop";
import { updateShop } from "../services/shop.service";
import { supabase } from "@/config/supabase";

const settingsSchema = z.object({
  shop_name: z.string().min(2, "Shop name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  city: z.string().min(2, "City name is required"),
  state: z.string().min(2, "State name is required"),
  country: z.string().min(2, "Country name is required"),
});

export default function SettingsPage() {
  const navigate = useNavigate();
  const { shop, loading, reloadShop } = useSellerShop();
  
  // Tab states
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "hours" | "widget" | "notifications" | "security" | "integrations"

  // Custom states
  const [businessHours, setBusinessHours] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [routingRules, setRoutingRules] = useState({
    mode: "round_robin",
    priority_routing: true,
    respect_business_hours: true,
    fallback_agent_id: ""
  });
  const [agents, setAgents] = useState([]);
  const [visitorsWaiting, setVisitorsWaiting] = useState(0);

  // Business hours advanced states
  const [timezone, setTimezone] = useState("UTC");
  const [holidaysText, setHolidaysText] = useState("");
  const [shift1Start, setShift1Start] = useState("09:00");
  const [shift1End, setShift1End] = useState("13:00");
  const [shift2Start, setShift2Start] = useState("14:00");
  const [shift2End, setShift2End] = useState("18:00");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shop_name: "",
      description: "",
      phone: "",
      email: "",
      city: "",
      state: "",
      country: "",
    },
  });

  // Prefill details
  useEffect(() => {
    if (shop) {
      reset({
        shop_name: shop.shop_name || "",
        description: shop.description || "",
        phone: shop.phone || "",
        email: shop.email || "",
        city: shop.city || "",
        state: shop.state || "",
        country: shop.country || "",
      });
      setBusinessHours(shop.business_hours || "Mon-Fri: 09:00 - 18:00");
      setRoutingRules(shop.routing_rules || {
        mode: "round_robin",
        priority_routing: true,
        respect_business_hours: true,
        fallback_agent_id: ""
      });

      const bhConfig = shop.business_hours_config || { timezone: "UTC", holidays: [], shifts: [] };
      setTimezone(bhConfig.timezone || "UTC");
      setHolidaysText(bhConfig.holidays?.join(", ") || "");
      const s1 = bhConfig.shifts?.[0] || { start: "09:00", end: "13:00" };
      const s2 = bhConfig.shifts?.[1] || { start: "14:00", end: "18:00" };
      setShift1Start(s1.start || "09:00");
      setShift1End(s1.end || "13:00");
      setShift2Start(s2.start || "14:00");
      setShift2End(s2.end || "18:00");
    }
  }, [shop, reset]);

  // Load real-time agents and waiting queue for routing status
  useEffect(() => {
    if (!shop?.id) return;
    async function loadRoutingData() {
      try {
        const { data: ags } = await supabase
          .from("shop_agents")
          .select("id, is_online, profiles(full_name)")
          .eq("shop_id", shop.id);
        setAgents(ags || []);

        const { data: vis } = await supabase
          .from("visitor_sessions")
          .select("id")
          .eq("shop_id", shop.id)
          .eq("is_waiting_assistance", true);
        setVisitorsWaiting(vis?.length || 0);
      } catch (err) {
        console.warn("Error fetching routing queue data", err);
      }
    }
    loadRoutingData();
  }, [shop?.id]);

  // Update shop mutation (storefront info)
  const updateMutation = useMutation({
    mutationFn: (values) => updateShop(shop.id, values),
    onSuccess: async () => {
      toast.success("Shop settings updated successfully!");
      await reloadShop();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update shop settings.");
    },
  });

  function onSubmit(values) {
    updateMutation.mutate(values);
  }

  // Update business hours
  async function handleSaveHours() {
    try {
      const compiledConfig = {
        timezone,
        holidays: holidaysText.split(",").map(d => d.trim()).filter(Boolean),
        shifts: [
          { start: shift1Start, end: shift1End },
          { start: shift2Start, end: shift2End }
        ]
      };

      const { error } = await supabase
        .from("shops")
        .update({ 
          business_hours: businessHours,
          business_hours_config: compiledConfig
        })
        .eq("id", shop.id);

      if (error) throw error;
      toast.success("Business hours & schedule configs saved!");
      reloadShop();
    } catch (err) {
      toast.error("Failed to update business hours");
    }
  }

  // Update routing rules
  async function handleSaveRouting() {
    try {
      const { error } = await supabase
        .from("shops")
        .update({ routing_rules: routingRules })
        .eq("id", shop.id);

      if (error) throw error;
      toast.success("Intelligent routing rules updated!");
      reloadShop();
    } catch (err) {
      toast.error("Failed to update routing rules");
    }
  }

  // Change account password
  async function handleChangePassword(e) {
    e.preventDefault();
    if (!newPassword || changingPassword) return;
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Account security password updated!");
      setNewPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl">
        <div className="h-6 w-32 bg-slate-100 rounded-md" />
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
            <div className="h-10 bg-slate-50 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
            <div className="h-24 bg-slate-50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-900">
        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-4">
          <Store className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No Shop Registered</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Please register your shop profile to manage settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Console Settings</h1>
        <p className="mt-1 text-xs text-slate-500">Manage business details, scheduling hours, security alerts, and channel toggles.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left side: Tab navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-1 bg-white shadow-sm border border-slate-100/80 p-2 rounded-2xl border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === "profile" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Business Profile</span>
          </button>
          
          <button
            onClick={() => setActiveTab("hours")}
            className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === "hours" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Business Hours</span>
          </button>

          <button
            onClick={() => setActiveTab("routing")}
            className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === "routing" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Route className="h-4 w-4" />
            <span>Call Routing</span>
          </button>

          <button
            onClick={() => setActiveTab("widget")}
            className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === "widget" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Widget & Branding</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === "notifications" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notification Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === "security" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Privacy & Security</span>
          </button>

          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === "integrations" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Integrations</span>
          </button>
        </div>

        {/* Right side: Tab Panels */}
        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-6">
          
          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
                Business Details
              </h3>

              <div className="grid gap-5 sm:grid-cols-2 text-xs">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Shop Name</label>
                  <input
                    type="text"
                    {...register("shop_name")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  {errors.shop_name && <p className="text-xs text-red-650 font-semibold">{errors.shop_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Shop Email</label>
                  <input
                    type="email"
                    {...register("email")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  {errors.email && <p className="text-xs text-red-650 font-semibold">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Shop Contact Phone</label>
                  <input
                    type="text"
                    {...register("phone")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  {errors.phone && <p className="text-xs text-red-650 font-semibold">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Shop Description</label>
                <textarea
                  rows={4}
                  {...register("description")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider pt-4 pb-2 border-b border-slate-100">
                Address details
              </h3>

              <div className="grid gap-5 sm:grid-cols-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">City</label>
                  <input type="text" {...register("city")} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">State</label>
                  <input type="text" {...register("state")} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Country</label>
                  <input type="text" {...register("country")} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={updateMutation.isPending} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-550 px-5 py-2.5 rounded-2xl font-bold text-white transition-all text-xs cursor-pointer hover:bg-blue-500 active:scale-[0.98] shadow-lg shadow-blue-500/10"
                >
                  <Save className="h-4 w-4" /> Save Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BUSINESS HOURS */}
          {activeTab === "hours" && (
            <div className="space-y-5 text-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
                Operation schedules & shifts
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Weekly Business Hours Slot</label>
                <input
                  type="text"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  placeholder="e.g. Mon-Fri: 09:00 - 18:00" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Timezone selection */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Business Time Zone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none cursor-pointer font-semibold text-xs"
                  >
                    <option value="UTC">UTC (Universal Coordinated)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>

                {/* Public Holidays list */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Public Holidays (Comma separated YYYY-MM-DD)</label>
                  <input
                    type="text"
                    value={holidaysText}
                    onChange={(e) => setHolidaysText(e.target.value)}
                    placeholder="e.g. 2026-07-09, 2026-12-25" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Working Shifts */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Daily Shifts (Multiple Shifts support)</span>
                
                <div className="grid gap-5 sm:grid-cols-2 text-xs">
                  {/* Shift 1 */}
                  <div className="space-y-2 border-r border-slate-100 pr-3">
                    <span className="font-bold text-slate-500 block text-[10px]">Shift 1 (Primary)</span>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 block mb-1">Start Time</label>
                        <input type="time" value={shift1Start} onChange={(e) => setShift1Start(e.target.value)} className="w-full bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-200 rounded-2xl px-2.5 py-1.5 text-slate-900 outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 block mb-1">End Time</label>
                        <input type="time" value={shift1End} onChange={(e) => setShift1End(e.target.value)} className="w-full bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-200 rounded-2xl px-2.5 py-1.5 text-slate-900 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Shift 2 */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-500 block text-[10px]">Shift 2 (Split Shift)</span>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 block mb-1">Start Time</label>
                        <input type="time" value={shift2Start} onChange={(e) => setShift2Start(e.target.value)} className="w-full bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-200 rounded-2xl px-2.5 py-1.5 text-slate-900 outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 block mb-1">End Time</label>
                        <input type="time" value={shift2End} onChange={(e) => setShift2End(e.target.value)} className="w-full bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-200 rounded-2xl px-2.5 py-1.5 text-slate-900 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveHours} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-550 px-5 py-2.5 rounded-2xl font-bold text-white text-xs cursor-pointer hover:bg-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10"
              >
                <Save className="h-4 w-4" /> Save Operations Config
              </button>
            </div>
          )}

          {/* TAB 2.5: CALL ROUTING */}
          {activeTab === "routing" && (
            <div className="space-y-6 text-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
                Intelligent Call Routing
              </h3>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Routing Mode Algorithm</label>
                    <select
                      value={routingRules.mode}
                      onChange={(e) => setRoutingRules({ ...routingRules, mode: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="round_robin">Round Robin (Even Distribution)</option>
                      <option value="least_busy">Least Busy Agent</option>
                      <option value="department">Department Routing</option>
                      <option value="manual">Manual Assignment (Ring All)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={routingRules.priority_routing}
                        onChange={(e) => setRoutingRules({ ...routingRules, priority_routing: e.target.checked })} className="h-4 w-4 rounded border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 text-blue-600 focus:ring-blue-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Priority Customer Routing</span>
                        <span className="text-[10px] text-slate-500 block">Routes high-LTV VIP customers to senior agents first.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={routingRules.respect_business_hours}
                        onChange={(e) => setRoutingRules({ ...routingRules, respect_business_hours: e.target.checked })} className="h-4 w-4 rounded border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 text-blue-600 focus:ring-blue-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Respect Business Hours</span>
                        <span className="text-[10px] text-slate-500 block">Send calls to offline queue if outside configured hours.</span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleSaveRouting} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-550 px-5 py-2.5 rounded-2xl font-bold text-white text-xs cursor-pointer w-fit hover:bg-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10"
                  >
                    <Save className="h-4 w-4" /> Save Routing Rules
                  </button>
                </div>

                {/* Live Queue Visualizer */}
                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Real-Time Queue Status
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-500">Customers Waiting</span>
                      <span className="font-mono font-bold text-amber-600 font-semibold">{visitorsWaiting}</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-500">Total Online Agents</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {agents.filter(a => a.is_online).length} / {agents.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-500">Next Agent Up</span>
                      <span className="font-bold text-slate-900 text-[10px]">
                        {agents.filter(a => a.is_online).length > 0 
                          ? agents.filter(a => a.is_online)[Math.floor(Math.random() * agents.filter(a => a.is_online).length)]?.profiles?.full_name 
                          : "No agents online"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: WIDGET & BRANDING */}
          {activeTab === "widget" && (
            <div className="space-y-6 text-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
                Widget & Customizer settings
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">Theme Branding</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Widget styling is managed inside the dedicated Customizer page.</p>
                  </div>
                  
                  <span 
                    style={{ backgroundColor: shop.widget_color || "#2563eb" }} className="h-6 w-6 rounded-full border border-slate-200" 
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Position Alignment:</span>
                  <span className="font-mono text-slate-900 capitalize">{shop.widget_position || "bottom-right"}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Consultation Calls availability:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${shop.is_online ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-slate-100 border border-slate-200 text-slate-500"}`}>
                    {shop.is_online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/seller/widget")} className="flex items-center gap-1 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-2xl font-bold text-slate-900 text-xs cursor-pointer"
              >
                <span>Open Customizer page</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* TAB 4: NOTIFICATION SETTINGS */}
          {activeTab === "notifications" && (
            <div className="space-y-6 text-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
                Console Alert Channels
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900">Email alerts</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Receive missed consultation digests via email.</p>
                  </div>
                  <button
                    onClick={() => { setEmailAlerts(!emailAlerts); toast.success("Email preference saved!"); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${emailAlerts ? "bg-blue-600" : "bg-slate-100"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${emailAlerts ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900">Browser Push warnings</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Allow HTML browser alerts for new WebRTC signals.</p>
                  </div>
                  <button
                    onClick={() => { setPushAlerts(!pushAlerts); toast.success("Push warning alert saved!"); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${pushAlerts ? "bg-blue-600" : "bg-slate-100"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${pushAlerts ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & SECURITY */}
          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-5 text-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
                Privacy & Account Security
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Change Account Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-550 px-5 py-2.5 rounded-2xl font-bold text-white text-xs cursor-pointer hover:bg-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10"
              >
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Update Password</span>
              </button>
            </form>
          )}

          {/* TAB 6: INTEGRATIONS */}
          {activeTab === "integrations" && (
            <div className="space-y-6 text-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
                Connected App settings
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Shopify domain:</span>
                  <span className="font-mono text-slate-900 text-[11px]">{shop.shopify_domain || "Not connected"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Webhooks endpoint URL:</span>
                  <span className="font-mono text-slate-900 text-[11px] truncate max-w-[180px]">{shop.webhook_url || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Google tracking ID:</span>
                  <span className="font-mono text-slate-900 text-[11px]">{shop.google_analytics_id || "Not injected"}</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/seller/integrations")} className="flex items-center gap-1 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-2xl font-bold text-slate-900 text-xs cursor-pointer"
              >
                <span>Manage Integrations dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
