import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Store, Phone, Mail, MapPin, Loader2, Save, Sliders, Code, Copy, Check, Video } from "lucide-react";
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
  const { shop, loading, reloadShop } = useSellerShop();
  const [activeTab, setActiveTab] = useState("store"); // "store" | "widget"

  // Widget settings states
  const [widgetColor, setWidgetColor] = useState("#2563eb");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [isOnline, setIsOnline] = useState(false);
  const [savingWidget, setSavingWidget] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Prefill storefront details
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

      // Prefill widget details
      setWidgetColor(shop.widget_color || "#2563eb");
      setWidgetPosition(shop.widget_position || "bottom-right");
      setIsOnline(!!shop.is_online);
    }
  }, [shop, reset]);

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

  // Update widget settings
  async function handleSaveWidgetSettings() {
    if (!shop || savingWidget) return;
    setSavingWidget(true);

    try {
      const { error } = await supabase
        .from("shops")
        .update({
          widget_color: widgetColor,
          widget_position: widgetPosition,
          is_online: isOnline,
        })
        .eq("id", shop.id);

      if (error) throw error;
      toast.success("Live Call Widget settings saved successfully!");
      await reloadShop();
    } catch (err) {
      console.error("[WidgetConfig] Save error:", err);
      toast.error("Failed to save widget settings");
    } finally {
      setSavingWidget(false);
    }
  }

  // Code Copy handler
  const widgetLoaderUrl = `${window.location.origin}/widget-loader.js`;
  const embedCode = `<!-- BridgeOne Live Video Call Widget Embed -->
<script>
  window.BridgeOneConfig = {
    shopId: "${shop?.id}"
  };
</script>
<script src="${widgetLoaderUrl}" async></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Embed script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-white">
        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
          <Store className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">No Shop Registered</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Please register your shop under the My Shop page first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shop Settings</h1>
          <p className="mt-1 text-slate-400">Configure storefront details and live call widget options.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800/80 rounded-2xl self-start">
          <button
            onClick={() => setActiveTab("store")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "store"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            Store Info
          </button>
          <button
            onClick={() => setActiveTab("widget")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "widget"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            Live Call Widget
          </button>
        </div>
      </div>

      {/* Tab CONTENT 1: Storefront Details Form */}
      {activeTab === "store" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <Store className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Storefront Info</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Shop Name */}
              <div className="space-y-2">
                <label className="text-sm text-slate-350 font-medium">Shop Name</label>
                <input
                  type="text"
                  {...register("shop_name")}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Fashion Hub"
                />
                {errors.shop_name && (
                  <p className="text-xs text-red-400">{errors.shop_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm text-slate-350 font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" /> Shop Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="shop@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm text-slate-350 font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" /> Contact Phone
                </label>
                <input
                  type="text"
                  {...register("phone")}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="9876543210"
                />
                {errors.phone && (
                  <p className="text-xs text-red-400">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm text-slate-350 font-medium">Shop Description</label>
              <textarea
                rows={4}
                {...register("description")}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Tell your customers what your shop sells..."
              />
              {errors.description && (
                <p className="text-xs text-red-400">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Location Details Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <MapPin className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Location Details</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {/* City */}
              <div className="space-y-2">
                <label className="text-sm text-slate-350 font-medium">City</label>
                <input
                  type="text"
                  {...register("city")}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Mumbai"
                />
                {errors.city && (
                  <p className="text-xs text-red-400">{errors.city.message}</p>
                )}
              </div>

              {/* State */}
              <div className="space-y-2">
                <label className="text-sm text-slate-350 font-medium">State / Region</label>
                <input
                  type="text"
                  {...register("state")}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Maharashtra"
                />
                {errors.state && (
                  <p className="text-xs text-red-400">{errors.state.message}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="text-sm text-slate-350 font-medium">Country</label>
                <input
                  type="text"
                  {...register("country")}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="India"
                />
                {errors.country && (
                  <p className="text-xs text-red-400">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" /> Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab CONTENT 2: Live Call Widget Configuration */}
      {activeTab === "widget" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Customizer Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <Sliders className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Widget Customization</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Color Picker */}
              <div className="space-y-3">
                <label className="text-sm text-slate-305 font-semibold">Theme Color (Primary)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="h-10 w-16 bg-transparent border border-slate-800 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-955 border border-slate-850 rounded-xl text-sm font-mono text-slate-205 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Position Select */}
              <div className="space-y-3">
                <label className="text-sm text-slate-305 font-semibold">Screen Alignment</label>
                <select
                  value={widgetPosition}
                  onChange={(e) => setWidgetPosition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-955 border border-slate-850 rounded-xl text-sm text-slate-205 focus:outline-none focus:border-blue-500"
                >
                  <option value="bottom-right">Bottom Right (Recommended)</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>

              {/* Online/Offline Toggle */}
              <div className="space-y-3 sm:col-span-2">
                <label className="text-sm text-slate-305 font-semibold block">Accept Live Calls Now</label>
                <div className="flex items-center gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                      isOnline ? "bg-green-500" : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isOnline ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-slate-105">
                      {isOnline ? "Available (Online)" : "Unavailable (Offline)"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {isOnline 
                        ? "Customers visiting your website will see the live option and can request consultations instantly." 
                        : "Customers will only be allowed to request callback schedules."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5 flex justify-end">
              <button
                onClick={handleSaveWidgetSettings}
                disabled={savingWidget}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500 focus:outline-none disabled:opacity-50 transition-all cursor-pointer text-sm"
              >
                {savingWidget ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Widget Config
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Script Embed Generator Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Embed Code Snippet</h2>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-slate-400">
                To load the live video shopping call widget on your storefront, copy and paste this Javascript snippet code into the <code className="bg-slate-950 text-slate-300 font-mono px-1 rounded">&lt;body&gt;</code> or <code className="bg-slate-950 text-slate-300 font-mono px-1 rounded">&lt;head&gt;</code> tags of your merchant website.
              </p>
              
              <div className="relative">
                <pre className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed whitespace-pre select-all">
                  {embedCode}
                </pre>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
