import { Star } from "lucide-react";

export default function ReviewCard({ review }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-lg font-semibold text-slate-900">
            {review.name}
          </h3>

          <p className="text-sm text-slate-500">
            {review.date}
          </p>

        </div>

        <div className="flex gap-1">

          {[...Array(review.rating)].map((_, index) => (
            <Star
              key={index}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
            />
          ))}

        </div>

      </div>

      <p className="mt-5 leading-7 text-slate-700">
        {review.comment}
      </p>

    </div>
  );
}