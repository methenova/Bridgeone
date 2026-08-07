import { useState } from "react";
import { AlertTriangle, Key, Loader2, ShieldAlert } from "lucide-react";
import { Modal } from "./Modal";

export default function RotateKeyModal({
  isOpen,
  onClose,
  onConfirm,
  shopName = "your shop",
  currentKey = "",
  isLoading = false,
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmClick = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("[RotateKeyModal] Error rotating key:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = isLoading || submitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isBusy ? null : onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 text-left">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Rotate Widget Security Key
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Regenerates the public API integration key for <span className="font-semibold text-slate-800">{shopName}</span>.
            </p>
          </div>
        </div>

        {/* High Impact Warning Card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Breaking Change Warning</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Existing embedded widgets on client websites will <strong className="underline">immediately stop loading</strong> once this key is rotated.
          </p>
          <p className="text-amber-700 text-[11px]">
            You must update the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">data-widget-key</code> attribute on all stores where the script is installed.
          </p>
        </div>

        {/* Current Key Box */}
        {currentKey && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Key to Revoke
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700">
              <Key className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{currentKey}</span>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isBusy}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition-all shadow-md shadow-amber-600/20 disabled:opacity-60 cursor-pointer"
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Confirm & Rotate Key
          </button>
        </div>
      </div>
    </Modal>
  );
}
