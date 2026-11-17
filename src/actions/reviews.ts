"use server";

import { and, eq, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import { orderItems, orders, products, reviewImages, reviews } from "@/db/schema";
import { CATALOG_TAG } from "@/lib/catalog";
import { reviewsTag } from "@/lib/reviews";
import { getCurrentUser } from "@/lib/user-auth";
import { issuesToMap, reviewSchema } from "@/lib/validators";

export type ReviewState = { ok: boolean; message: string; errors: Record<string, string> };

type Input = { productId: string; rating: number; title: string; body: string; images: { url: string; publicId: string }[] };

/** Signed-in customers only (that keeps spam and fake reviews down). One review per customer per product. */
export async function submitReview(input: Input): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to write a review.", errors: {} };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "", errors: issuesToMap(parsed.error.issues) };
  const data = parsed.data;

  // Product check, "already reviewed" check and "verified buyer" check: three flat queries, one round trip.
  const [productRows, existing, bought] = await db.batch([
    db.select({ id: products.id }).from(products).where(and(eq(products.id, data.productId), eq(products.isActive, true))).limit(1),
    db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.productId, data.productId), eq(reviews.userId, user.id))).limit(1),
    db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.userId, user.id), eq(orderItems.productId, data.productId), ne(orders.status, "cancelled")))
      .limit(1),
  ]);

  if (productRows.length === 0) return { ok: false, message: "This product is no longer available.", errors: {} };
  if (existing.length > 0) return { ok: false, message: "You have already reviewed this product.", errors: {} };

  const reviewId = crypto.randomUUID();
  const statements = [
    db.insert(reviews).values({
      id: reviewId,
      productId: data.productId,
      userId: user.id,
      authorName: user.name,
      rating: data.rating,
      title: data.title,
      body: data.body,
      verified: bought.length > 0,
    }),
    ...(data.images.length > 0
      ? [db.insert(reviewImages).values(data.images.map((image, position) => ({ reviewId, url: image.url, publicId: image.publicId, position })))]
      : []),
  ];
  await db.batch(statements as unknown as Parameters<typeof db.batch>[0]);

  updateTag(reviewsTag(data.productId));
  updateTag(CATALOG_TAG); // star ratings on product cards
  return { ok: true, message: "Thank you! Your review is live.", errors: {} };
}
