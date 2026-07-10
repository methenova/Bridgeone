import { useState } from "react";

export default function ShopLogoUpload({
  value,
  onChange,
}) {
  const [preview, setPreview] = useState(value || "");

  function handleFile(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setPreview(URL.createObjectURL(file));

    onChange(file);
  }

  return (
    <div className="mb-8">

      <label className="mb-3 block text-lg font-semibold text-slate-900">
        Shop Logo
      </label>

      <div className="flex items-center gap-6">

        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

          {preview ? (
            <img
              src={preview}
              alt="Shop Logo"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-slate-500">
              Logo
            </span>
          )}

        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="text-slate-900"
        />

      </div>

    </div>
  );
}