import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { createShop, updateShop } from "../../services/shop.service";
import { uploadShopLogo } from "../../services/storage.service";
import ShopLogoUpload from "./ShopLogoUpload";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Validation rules
function validateForm(data) {
  const errors = {};

  if (!data.shop_name.trim()) {
    errors.shop_name = "Shop name is required.";
  } else if (data.shop_name.trim().length < 2) {
    errors.shop_name = "Shop name must be at least 2 characters.";
  }

  if (!data.email.trim()) {
    errors.email = "Business email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (data.phone && !/^[+\d\s()-]{7,20}$/.test(data.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!data.city.trim()) {
    errors.city = "City is required.";
  }

  if (!data.state.trim()) {
    errors.state = "State is required.";
  }

  if (!data.country.trim()) {
    errors.country = "Country is required.";
  }

  if (data.pincode && !/^\d{4,10}$/.test(data.pincode.trim())) {
    errors.pincode = "Pincode must be 4-10 digits.";
  }

  if (
    data.website_url &&
    data.website_url.trim() &&
    !/^https?:\/\/.+\..+/.test(data.website_url.trim())
  ) {
    errors.website_url = "Website URL must start with http:// or https://";
  }

  return errors;
}

export default function ShopForm({ shop, reloadShop }) {
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    shop_name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    website_url: "",
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
        country: shop.country || "India",
        pincode: shop.pincode || "",
        website_url: shop.website_url || "",
      });
    }
  }, [shop]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (successMsg) setSuccessMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMsg("");

    // Validate
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      setLoading(true);

      // Upload logo if a new file is selected
      let logoUrl = shop?.logo_url || null;
      if (logoFile) {
        logoUrl = await uploadShopLogo(logoFile, user.id);
      }

      // Build the payload — only include non-empty fields
      const payload = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === "string") {
          payload[key] = value.trim();
        } else {
          payload[key] = value;
        }
      });
      payload.logo_url = logoUrl;

      if (shop) {
        await updateShop(shop.id, payload);
        setSuccessMsg("Shop updated successfully!");
      } else {
        payload.owner_id = user.id;
        await createShop(payload);
        setSuccessMsg("Shop created successfully!");
      }

      await reloadShop();
    } catch (error) {
      console.error(error);
      setErrors({ _form: error.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // Helper to render field error
  function FieldError({ field }) {
    if (!errors[field]) return null;
    return (
      <p className="mt-1 text-[11px] font-semibold text-red-500 flex items-center gap-1">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {errors[field]}
      </p>
    );
  }

  // Input class helper
  function inputClass(field) {
    return `w-full rounded-2xl border ${
      errors[field] ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"
    } bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 font-semibold shadow-xs`;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 p-8">

      {/* Global Form Error */}
      {errors._form && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errors._form}</span>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Shop Logo Upload */}
      <ShopLogoUpload value={shop?.logo_url} onChange={setLogoFile} />

      {/* Form Fields */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Shop Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="shop_name"
            placeholder="e.g. Acme Apparel"
            value={formData.shop_name}
            onChange={handleChange}
            className={inputClass("shop_name")}
          />
          <FieldError field="shop_name" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Business Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="e.g. contact@acme.com"
            value={formData.email}
            onChange={handleChange}
            className={inputClass("email")}
          />
          <FieldError field="email" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
          <input
            type="text"
            name="phone"
            placeholder="e.g. +91 9876543210"
            value={formData.phone}
            onChange={handleChange}
            className={inputClass("phone")}
          />
          <FieldError field="phone" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Website URL</label>
          <input
            type="text"
            name="website_url"
            placeholder="e.g. https://acme.com"
            value={formData.website_url}
            onChange={handleChange}
            className={inputClass("website_url")}
          />
          <FieldError field="website_url" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            placeholder="e.g. Mumbai"
            value={formData.city}
            onChange={handleChange}
            className={inputClass("city")}
          />
          <FieldError field="city" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            placeholder="e.g. Maharashtra"
            value={formData.state}
            onChange={handleChange}
            className={inputClass("state")}
          />
          <FieldError field="state" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="country"
            placeholder="e.g. India"
            value={formData.country}
            onChange={handleChange}
            className={inputClass("country")}
          />
          <FieldError field="country" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pincode</label>
          <input
            type="text"
            name="pincode"
            placeholder="e.g. 400001"
            value={formData.pincode}
            onChange={handleChange}
            className={inputClass("pincode")}
          />
          <FieldError field="pincode" />
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
          className={inputClass("description")}
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
          className={inputClass("address")}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Saving..." : shop ? "Update Shop" : "Create Shop"}
      </button>

    </form>
  );
}