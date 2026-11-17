import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { loadProductGraph, type GraphProduct } from "./product-graph";
import type { CatalogProduct } from "./catalog-types";
import { parseMethods, parseSizes } from "./policy";

/** Anything that changes products (admin save/delete, new order = stock) must invalidate this tag. */
export const CATALOG_TAG = "catalog";
const ONE_HOUR = 60 * 60;

type Rating = { avg: number; count: number };

function toCatalog(row: GraphProduct, rating: Rating | undefined, full = true): CatalogProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    gender: row.gender,
    category: row.category,
    collection: row.collection,
    // Long text is only needed on the product page, so the list used by every other page stays small.
    description: full ? row.description : "",
    fabric: row.fabric,
    fit: row.fit,
    pieces: row.pieces,
    care: full ? row.care : null,
    badge: row.badge,
    sizes: parseSizes(row.sizes),
    returnDays: row.returnDays,
    paymentMethods: parseMethods(row.paymentMethods),
    priceCents: row.priceCents,
    salePriceCents: row.salePriceCents,
    saleEndsAtMs: row.saleEndsAt ? row.saleEndsAt.getTime() : null,
    ratingAvg: rating?.avg ?? 0,
    ratingCount: rating?.count ?? 0,
    freeDelivery: row.freeDelivery,
    deliveryFeeCents: row.deliveryFeeCents,
    stock: row.stock,
    createdAtMs: row.createdAt.getTime(),
    colors: row.colors.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      // Cards show the first two photos (the second one appears on hover); the product page loads them all separately.
      images: c.images.map((i) => ({ id: i.id, url: i.url })),
    })),
  };
}

/** Average rating + review count per product: one grouped query, run together with the catalog query. */
async function loadRatings() {
  const rows = await db
    .select({ productId: reviews.productId, avg: sql<number>`round(avg(${reviews.rating})::numeric, 1)::float`, count: sql<number>`count(*)::int` })
    .from(reviews)
    .groupBy(reviews.productId);
  return new Map<string, Rating>(rows.map((row) => [row.productId, { avg: Number(row.avg), count: row.count }]));
}

/**
 * Every active product with the first two images of each color and its rating.
 * 4 flat queries in ONE round trip, cached for an hour and refreshed instantly when the admin edits a product,
 * a new order changes stock, or a review is added or removed.
 */
export const getCatalog = unstable_cache(
  async (): Promise<CatalogProduct[]> => {
    const [rows, ratings] = await Promise.all([loadProductGraph(eq(products.isActive, true), 2), loadRatings()]);
    return rows.map((row) => toCatalog(row, ratings.get(row.id), false));
  },
  ["catalog-list-v5"],
  { tags: [CATALOG_TAG], revalidate: ONE_HOUR },
);

/** One product with all its images, cached per slug. */
export function getProductDetail(slug: string): Promise<CatalogProduct | null> {
  return unstable_cache(
    async () => {
      // Rating summary for the product page comes from the reviews query (lib/reviews.ts).
      const [row] = await loadProductGraph(and(eq(products.slug, slug), eq(products.isActive, true)), 12, 1);
      return row ? toCatalog(row, undefined, true) : null;
    },
    ["product-detail-v5", slug],
    { tags: [CATALOG_TAG], revalidate: ONE_HOUR },
  )();
}
