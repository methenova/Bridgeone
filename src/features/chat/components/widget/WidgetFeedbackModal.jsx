import React from "react";
import { Star } from "lucide-react";

export function WidgetFeedbackModal({
  answeringAgentName,
  finalDurationText,
  discussedProducts,
  feedbackSubmitted,
  customerRating,
  setCustomerRating,
  feedbackText,
  setFeedbackText,
  onSubmitFeedback,
  onClose,
  primaryColor
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto my-auto w-full px-2">
      <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-inner shrink-0">
        <Star className="h-7 w-7 fill-amber-500" />
      </div>

      <div className="space-y-1">
        <h2 className="text-sm font-extrabold text-slate-900">Consultation Summary</h2>
        <p className="text-[11px] text-slate-500">Thank you for your valuable time!</p>
      </div>

      {/* Call Info details */}
      <div className="w-full bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 text-left text-[11px] space-y-1.5 font-semibold text-slate-350">
        <div className="flex justify-between">
          <span className="text-slate-500">Expert Agent:</span>
          <span className="text-slate-900">{answeringAgentName || "Our Store Specialist"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Call Duration:</span>
          <span className="text-slate-900">{finalDurationText || "0s"}</span>
        </div>
        {discussedProducts && discussedProducts.length > 0 && (
          <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-200/60">
            <span className="text-slate-500">Products Discussed:</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {discussedProducts.map((p, idx) => (
                <span
                  key={idx}
                  className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Star Rating and Comment Form */}
      {!feedbackSubmitted ? (
        <form onSubmit={onSubmitFeedback} className="w-full space-y-3.5 pt-2">
          <div className="space-y-1.5">
            <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">
              Rate Your Experience
            </span>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCustomerRating(star)}
                  aria-label={`Rate ${star} Stars`}
                  className="text-slate-500 hover:text-amber-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
                >
                  <Star
                    className={`h-6 w-6 ${customerRating >= star ? "text-amber-400 fill-amber-400" : "text-slate-700"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              aria-label="Write your feedback comments"
              placeholder="Tell us how we did (optional)..."
              className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            style={{ backgroundColor: primaryColor }}
            className="w-full rounded-xl py-3 text-xs font-bold text-slate-900 shadow-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            Submit Review
          </button>
        </form>
      ) : (
        <div className="space-y-3 pt-2 w-full">
          <p className="text-xs text-green-400 font-bold">✓ Feedback recorded. Thank you!</p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white shadow-sm hover:bg-slate-100 border border-slate-200 text-xs font-bold py-3 text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            Close & Return
          </button>
        </div>
      )}
    </div>
  );
}
