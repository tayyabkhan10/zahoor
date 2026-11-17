import "server-only";
import { unstable_cache } from "next/cache";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviewImages, reviews } from "@/db/schema";

export const reviewsTag = (productId: string) => `reviews:${productId}`;

export type ReviewView = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: string; // ISO
  images: { id: string; url: string }[];
};

export type ReviewSummary = { avg: number; count: number; distribution: number[] }; // distribution[0] = 1 star ... [4] = 5 stars

/** Reviews of one product: newest 40, their images and the star summary. 3 flat queries, ONE round trip, cached per product. */
export function getProductReviews(productId: string): Promise<{ reviews: ReviewView[]; summary: ReviewSummary }> {
  return unstable_cache(
    async () => {
      const reviewQuery = db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt)).limit(40);
      const imageQuery = db
        .select({ id: reviewImages.id, reviewId: reviewImages.reviewId, url: reviewImages.url })
        .from(reviewImages)
        .innerJoin(reviews, eq(reviewImages.reviewId, reviews.id))
        .where(eq(reviews.productId, productId))
        .orderBy(asc(reviewImages.position));
      const countQuery = db
        .select({ rating: reviews.rating, count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(eq(reviews.productId, productId))
        .groupBy(reviews.rating);

      const [rows, images, counts] = await db.batch([reviewQuery, imageQuery, countQuery]);

      const byReview = new Map<string, { id: string; url: string }[]>();
      for (const image of images) {
        const list = byReview.get(image.reviewId) ?? [];
        list.push({ id: image.id, url: image.url });
        byReview.set(image.reviewId, list);
      }

      const distribution = [0, 0, 0, 0, 0];
      let total = 0;
      let sum = 0;
      for (const row of counts) {
        if (row.rating >= 1 && row.rating <= 5) {
          distribution[row.rating - 1] = row.count;
          total += row.count;
          sum += row.rating * row.count;
        }
      }

      return {
        reviews: rows.map((row) => ({
          id: row.id,
          authorName: row.authorName,
          rating: row.rating,
          title: row.title,
          body: row.body,
          verified: row.verified,
          createdAt: row.createdAt.toISOString(),
          images: byReview.get(row.id) ?? [],
        })),
        summary: { avg: total ? Math.round((sum / total) * 10) / 10 : 0, count: total, distribution },
      };
    },
    ["product-reviews-v1", productId],
    { tags: [reviewsTag(productId)], revalidate: 60 * 60 },
  )();
}

/** Admin list: newest 200 reviews with product name and author, images included. Two flat queries in one round trip. */
export async function listReviewsForAdmin() {
  const reviewQuery = db.query.reviews.findMany({
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    limit: 200,
    with: { product: { columns: { name: true, slug: true } }, user: { columns: { email: true } } },
  });
  const rows = await reviewQuery;
  if (rows.length === 0) return [];
  const images = await db
    .select({ id: reviewImages.id, reviewId: reviewImages.reviewId, url: reviewImages.url })
    .from(reviewImages)
    .where(inArray(reviewImages.reviewId, rows.map((row) => row.id)))
    .orderBy(asc(reviewImages.position));
  const byReview = new Map<string, { id: string; url: string }[]>();
  for (const image of images) {
    const list = byReview.get(image.reviewId) ?? [];
    list.push({ id: image.id, url: image.url });
    byReview.set(image.reviewId, list);
  }
  return rows.map((row) => ({ ...row, images: byReview.get(row.id) ?? [] }));
}
