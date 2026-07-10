import { useEffect, useState } from "react";

import { useAuthContext } from "@/context/AuthContext";

import {
  createShop,
  updateShop,
} from "../../services/shop.service";

import {
  uploadShopLogo,
} from "../../services/storage.service";

import ShopLogoUpload from "./ShopLogoUpload";

export default function ShopForm({
  shop,
  reloadShop,
}) {
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  const [formData, setFormData] = useState({
    shop_name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  useEffect(() => {
    if (shop) {
      setFormData({
        shop_name: shop.shop_name || "",
        description: shop.description || "",
        phone: shop.phone || "",
        email: shop.email || "",
        address: shop.address || "",
        city: shop.city || "",
        state: shop.state || "",
        country: shop.country || "",
        pincode: shop.pincode || "",
      });
    }
  }, [shop]);

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      // Upload logo if a new file is selected
      let logoUrl = shop?.logo_url || null;

      if (logoFile) {
        logoUrl = await uploadShopLogo(
          logoFile,
          user.id
        );
      }

      if (shop) {
        await updateShop(shop.id, {
          ...formData,
          logo_url: logoUrl,
        });

        alert("Shop updated successfully.");
      } else {
        await createShop({
          ...formData,
          owner_id: user.id,
          logo_url: logoUrl,
        });

        alert("Shop created successfully.");
      }

      await reloadShop();

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 p-8"
    >

      {/* Shop Logo Upload */}

      <ShopLogoUpload
        value={shop?.logo_url}
        onChange={setLogoFile}
      />

      {/* Form Fields */}

      {/* Form Fields */}

      <div className="mt-8 grid gap-6 md:grid-cols-2">

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Shop Name *</label>
          <input
            type="text"
            name="shop_name"
            placeholder="e.g. Acme Apparel"
            value={formData.shop_name}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Business Email *</label>
          <input
            type="email"
            name="email"
            placeholder="e.g. contact@acme.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
          <input
            type="text"
            name="phone"
            placeholder="e.g. +91 9876543210"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">City</label>
          <input
            type="text"
            name="city"
            placeholder="e.g. Mumbai"
            value={formData.city}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">State</label>
          <input
            type="text"
            name="state"
            placeholder="e.g. Maharashtra"
            value={formData.state}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Country</label>
          <input
            type="text"
            name="country"
            placeholder="e.g. India"
            value={formData.country}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
          />
        </div>

      </div>

      <div className="mt-6 space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Shop Description</label>
        <textarea
          name="description"
          placeholder="Describe your brand and product collections to customers..."
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
        />
      </div>

      <div className="mt-6 space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Complete Address</label>
        <textarea
          name="address"
          placeholder="Shop physical address..."
          value={formData.address}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
        />
      </div>

      <div className="mt-6 space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pincode</label>
        <input
          type="text"
          name="pincode"
          placeholder="e.g. 400001"
          value={formData.pincode}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : shop
          ? "Update Shop"
          : "Create Shop"}
      </button>

    </form>
  );
}