import ReviewsTable from "@/components/admin/ReviewsTable";
import { requireAdmin } from "@/lib/auth";
import { listReviewsForAdmin } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" });

export default async function AdminReviewsPage() {
  await requireAdmin();
  const reviews = await listReviewsForAdmin();

  return (
    <div>
      <h1 className="text-3xl text-brand">Reviews</h1>
      <p className="mt-2 text-sm text-muted">Newest first. Delete anything fake or inappropriate. The review and its photos are removed from the product page straight away.</p>
      <ReviewsTable
        reviews={reviews.map((review) => ({
          id: review.id,
          productName: review.product?.name ?? "Deleted product",
          productSlug: review.product?.slug ?? "",
          author: review.authorName,
          email: review.user?.email ?? "",
          rating: review.rating,
          title: review.title,
          body: review.body,
          verified: review.verified,
          placed: dateFormat.format(review.createdAt),
          images: review.images,
        }))}
      />
    </div>
  );
}
