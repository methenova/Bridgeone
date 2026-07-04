import ReviewCard from "./ReviewCard";
import { reviewData } from "../data/reviewData";

export default function ReviewList() {
  return (
    <section className="mt-20">

      <h2 className="mb-8 text-3xl font-bold text-white">
        Customer Reviews
      </h2>

      <div className="space-y-6">

        {reviewData.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
          />
        ))}

      </div>

    </section>
  );
}