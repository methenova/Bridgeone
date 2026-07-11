import { useState } from "react";
import { Plus, Star, Pencil, Trash2 } from "lucide-react";

import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "@/features/customer/hooks/useAddresses";
import AddressForm from "./AddressForm";

export default function AddressList({ selectedId, onSelect }) {
  const { data: addresses = [], isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Addresses */}
      {addresses.map((addr) => {
        const isSelected = selectedId === addr.id;

        return (
          <div
            key={addr.id}
            onClick={() => onSelect(addr)}
            className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30"
                : "border-slate-200 bg-white shadow-sm hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Radio */}
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected ? "border-blue-500" : "border-slate-300"
                }`}
              >
                {isSelected && (
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{addr.name}</span>
                  <span className="text-sm text-slate-500">· {addr.phone}</span>
                  {addr.is_default && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                      <Star className="h-2.5 w-2.5" /> Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {addr.address_line1}
                  {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                </p>
                <p className="text-sm text-slate-500">
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!addr.is_default && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDefault.mutate(addr.id); }}
                    title="Set as default"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-amber-500/15 hover:text-amber-400"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingAddress(addr); setShowForm(true); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-500/15 hover:text-blue-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAddress.mutate(addr.id); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add new address */}
      {showForm ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h4 className="mb-4 text-sm font-semibold text-slate-900">
            {editingAddress ? "Edit Address" : "New Address"}
          </h4>
          <AddressForm
            address={editingAddress}
            onSuccess={() => { setShowForm(false); setEditingAddress(null); }}
            onCancel={() => { setShowForm(false); setEditingAddress(null); }}
          />
        </div>
      ) : (
        <button
          onClick={() => { setEditingAddress(null); setShowForm(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-4 text-sm text-slate-500 transition-colors hover:border-blue-500/50 hover:text-blue-400"
        >
          <Plus className="h-4 w-4" />
          Add New Address
        </button>
      )}
    </div>
  );
}
