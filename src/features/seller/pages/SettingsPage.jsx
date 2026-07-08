import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Store, Phone, Mail, Loader2, Save } from "lucide-react";
import useSellerShop from "../hooks/useSellerShop";
import { updateShop } from "../services/shop.service";

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
          Please register your shop under the Profile page first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Shop Settings</h1>
        <p className="mt-1 text-slate-400">Configure storefront details and address coordinates.</p>
      </div>

      {/* Storefront Details Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Store className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Storefront Info</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-xs">
            {/* Shop Name */}
            <div className="space-y-2">
              <label className="text-sm text-slate-350 font-medium">Shop Name</label>
              <input
                type="text"
                {...register("shop_name")}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
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
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed text-xs"
              placeholder="Tell customers about your store, product categories, or live selling hours..."
            />
            {errors.description && (
              <p className="text-xs text-red-400">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Address Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Store className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Address Details</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 text-xs">
            {/* City */}
            <div className="space-y-2">
              <label className="text-sm text-slate-350 font-medium">City</label>
              <input
                type="text"
                {...register("city")}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.city && (
                <p className="text-xs text-red-400">{errors.city.message}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-2">
              <label className="text-sm text-slate-350 font-medium">State</label>
              <input
                type="text"
                {...register("state")}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.country && (
                <p className="text-xs text-red-400">{errors.country.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500 focus:outline-none disabled:opacity-50 transition-all cursor-pointer text-xs"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Store Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
