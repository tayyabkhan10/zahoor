import type { ReviewSummary, ReviewView } from "@/lib/reviews";
import ReviewForm from "./ReviewForm";
import ReviewImages from "./ReviewImages";
import Stars from "./Stars";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Karachi" });

/** Customer reviews under a product. Data comes from the cached reviews query; the form is the only interactive part. */
export default function ReviewsSection({
  productId,
  productSlug,
  productName,
  reviews,
  summary,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  reviews: ReviewView[];
  summary: ReviewSummary;
}) {
  return (
    <section id="reviews" className="mx-auto mt-16 max-w-5xl scroll-mt-40 border-t border-line pt-12">
      <h2 className="text-3xl text-brand sm:text-4xl">Customer reviews</h2>

      <div className="mt-8 grid gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-8">
          {summary.count > 0 ? (
            <div>
              <div className="flex items-end gap-3">
                <span className="font-serif text-6xl leading-none text-brand">{summary.avg.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars value={summary.avg} className="h-5 w-5" />
                  <p className="mt-1 text-sm text-muted">
                    {summary.count} {summary.count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution[star - 1] ?? 0;
                  return (
                    <li key={star} className="flex items-center gap-3">
                      <span className="w-8 text-muted">{star} ★</span>
                      <span className="h-2 flex-1 bg-sand">
                        <span className="block h-2 bg-amber-500" style={{ width: `${(count / summary.count) * 100}%` }} />
                      </span>
                      <span className="w-6 text-right text-muted">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted">No reviews yet. Be the first to review {productName}.</p>
          )}

          <ReviewForm productId={productId} productSlug={productSlug} />
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {reviews.length === 0 && <li className="py-10 text-center text-sm text-muted">Reviews with photos will appear here.</li>}
          {reviews.map((review) => (
            <li key={review.id} className="py-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={review.rating} />
                {review.verified && <span className="bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Verified purchase</span>}
              </div>
              {review.title && <p className="mt-2 font-semibold text-neutral-900">{review.title}</p>}
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{review.body}</p>
              <ReviewImages images={review.images} alt={`Photo from ${review.authorName}'s review`} />
              <p className="mt-3 text-xs text-muted">
                {review.authorName} · {dateFormat.format(new Date(review.createdAt))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
