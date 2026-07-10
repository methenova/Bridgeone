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

      <div className="mt-8 grid gap-6 md:grid-cols-2">

        <input
          type="text"
          name="shop_name"
          placeholder="Shop Name"
          value={formData.shop_name}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
        />

        <input
          type="email"
          name="email"
          placeholder="Business Email"
          value={formData.email}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
        />

        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
        />

        <input
          type="text"
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
        />

        <input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
        />

      </div>

      <textarea
        name="description"
        placeholder="Shop Description"
        value={formData.description}
        onChange={handleChange}
        rows={5}
        className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
      />

      <textarea
        name="address"
        placeholder="Complete Address"
        value={formData.address}
        onChange={handleChange}
        rows={3}
        className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
      />

      <input
        type="text"
        name="pincode"
        placeholder="Pincode"
        value={formData.pincode}
        onChange={handleChange}
        className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
      />

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