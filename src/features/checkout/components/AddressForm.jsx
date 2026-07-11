import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { useCreateAddress, useUpdateAddress } from "@/features/customer/hooks/useAddresses";

const addressSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";
const errorClass = "mt-1 text-xs text-red-400";

export default function AddressForm({ address, onSuccess, onCancel }) {
  const isEditing = !!address;
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: address ?? {
      name: "", phone: "", address_line1: "", address_line2: "",
      city: "", state: "", pincode: "",
    },
  });

  async function onSubmit(values) {
    if (isEditing) {
      await updateAddress.mutateAsync({ id: address.id, data: values });
    } else {
      await createAddress.mutateAsync(values);
    }
    onSuccess?.();
  }

  const isBusy = isSubmitting || createAddress.isPending || updateAddress.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">

        <div>
          <label className={labelClass}>Full Name *</label>
          <input {...register("name")} placeholder="John Doe" className={fieldClass} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Mobile Number *</label>
          <input {...register("phone")} placeholder="9876543210" className={fieldClass} />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Address Line 1 *</label>
          <input {...register("address_line1")} placeholder="House No., Street, Area" className={fieldClass} />
          {errors.address_line1 && <p className={errorClass}>{errors.address_line1.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Address Line 2</label>
          <input {...register("address_line2")} placeholder="Landmark (optional)" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>City *</label>
          <input {...register("city")} placeholder="Mumbai" className={fieldClass} />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>

        <div>
          <label className={labelClass}>State *</label>
          <input {...register("state")} placeholder="Maharashtra" className={fieldClass} />
          {errors.state && <p className={errorClass}>{errors.state.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Pincode *</label>
          <input {...register("pincode")} placeholder="400001" maxLength={6} className={fieldClass} />
          {errors.pincode && <p className={errorClass}>{errors.pincode.message}</p>}
        </div>

      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isBusy}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-60"
        >
          {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Update Address" : "Save Address"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
