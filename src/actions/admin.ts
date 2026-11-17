"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/db";
import { orders, reviewImages, reviews } from "@/db/schema";
import { CATALOG_TAG } from "@/lib/catalog";
import { deleteImages } from "@/lib/cloudinary";
import { reviewsTag } from "@/lib/reviews";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/config";
import { isUuid } from "@/lib/validators";

export type DeleteResult = { ok: boolean; deleted: number; error?: string };

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!isUuid(id) || !(ORDER_STATUSES as readonly string[]).includes(status)) return;

  await db.update(orders).set({ status }).where(eq(orders.id, id));
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
}

/** Deletes one order (its items go with it). */
export async function deleteOrder(id: string): Promise<DeleteResult> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, deleted: 0, error: "Invalid order" };

  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath("/admin");
  return { ok: true, deleted: 1 };
}

/** Bulk delete: pass the ids of the selected orders. */
export async function deleteOrders(ids: string[]): Promise<DeleteResult> {
  await requireAdmin();
  const valid = [...new Set(ids)].filter(isUuid).slice(0, 500);
  if (valid.length === 0) return { ok: false, deleted: 0, error: "No orders selected" };

  await db.delete(orders).where(inArray(orders.id, valid));
  revalidatePath("/admin");
  return { ok: true, deleted: valid.length };
}

/** Removes every order. Used to clear test orders. */
export async function deleteAllOrders(): Promise<DeleteResult> {
  await requireAdmin();
  const rows = await db.delete(orders).returning({ id: orders.id });
  revalidatePath("/admin");
  return { ok: true, deleted: rows.length };
}

/** Admin moderation: removes reviews (fake or abusive) together with their photos. Bulk friendly. */
export async function deleteReviews(ids: string[]): Promise<DeleteResult> {
  await requireAdmin();
  const valid = [...new Set(ids)].filter(isUuid).slice(0, 200);
  if (valid.length === 0) return { ok: false, deleted: 0, error: "No reviews selected" };

  const [targets, images] = await db.batch([
    db.select({ id: reviews.id, productId: reviews.productId }).from(reviews).where(inArray(reviews.id, valid)),
    db.select({ publicId: reviewImages.publicId }).from(reviewImages).where(inArray(reviewImages.reviewId, valid)),
  ]);

  await db.delete(reviews).where(inArray(reviews.id, valid)); // review_images go with it (cascade)
  await deleteImages(images.map((image) => image.publicId));

  for (const productId of new Set(targets.map((target) => target.productId))) updateTag(reviewsTag(productId));
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/reviews");
  return { ok: true, deleted: targets.length };
}
