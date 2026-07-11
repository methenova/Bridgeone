import { Check, Package, Truck, CheckCircle2, ShoppingBag } from "lucide-react";

const STEPS = [
  { value: "pending", label: "Ordered", icon: ShoppingBag },
  { value: "accepted", label: "Accepted", icon: Check },
  { value: "packed", label: "Packed", icon: Package },
  { value: "shipped", label: "Shipped", icon: Truck },
  { value: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function OrderStatusTimeline({ status }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className={`rounded-xl border p-4 text-center text-sm font-semibold ${
        status === "cancelled"
          ? "border-red-500/20 bg-red-500/5 text-red-400"
          : "border-purple-500/20 bg-purple-500/5 text-purple-400"
      }`}>
        {status === "cancelled" ? "❌ This order was cancelled." : "↩️ This order has been returned and refunded."}
      </div>
    );
  }

  // Get index of the current status
  const currentStepIndex = STEPS.findIndex((s) => s.value === status);

  return (
    <div className="py-6 overflow-x-auto scrollbar-none">
      <div className="flex min-w-[600px] items-center justify-between px-4">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.value} className="relative flex flex-1 flex-col items-center">
              {/* Connector line (right side of step, except last step) */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute left-1/2 top-5 h-0.5 w-full -translate-y-1/2 transition-colors duration-300 ${
                    idx < currentStepIndex ? "bg-blue-500" : "bg-slate-100"
                  }`}
                />
              )}

              {/* Icon circle */}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "border-slate-200 bg-white shadow-sm text-slate-500"
                } ${isCurrent ? "scale-110 ring-4 ring-blue-500/20" : ""}`}
              >
                <StepIcon className="h-5 w-5" />
              </div>

              {/* Step Label */}
              <span
                className={`mt-2 text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                  isCompleted ? "text-slate-900" : "text-slate-500"
                } ${isCurrent ? "text-blue-400 font-bold" : ""}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
