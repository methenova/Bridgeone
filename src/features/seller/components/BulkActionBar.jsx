import { motion, AnimatePresence } from "framer-motion";
import { Trash2, CheckCircle, XCircle, X } from "lucide-react";

export default function BulkActionBar({
  selectedCount,
  onDelete,
  onActivate,
  onDeactivate,
  onClear,
  isLoading = false,
}) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          key="bulk-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/50 bg-white/90 shadow-2xl backdrop-blur-md px-5 py-3.5">
            {/* Selection count */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {selectedCount}
              </span>
              <span className="text-sm font-medium text-slate-600">
                {selectedCount === 1 ? "product" : "products"} selected
              </span>
            </div>

            {/* Activate */}
            <button
              onClick={onActivate}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              Activate
            </button>

            {/* Deactivate */}
            <button
              onClick={onDeactivate}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              Deactivate
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>

            {/* Clear selection */}
            <button
              onClick={onClear}
              disabled={isLoading}
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:text-slate-900"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
