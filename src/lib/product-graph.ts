import "server-only";
import { asc, desc, eq, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { productColors, productImages, products } from "@/db/schema";

export type GraphColor = { id: string; name: string; hex: string; images: { id: string; url: string }[] };
export type GraphProduct = typeof products.$inferSelect & { colors: GraphColor[] };

export async function loadProductGraph(where: SQL | undefined, imagesPerColor: number, limit = 1000): Promise<GraphProduct[]> {
  const productQuery = db.select().from(products).where(where).orderBy(desc(products.createdAt)).limit(limit);

  const colorQuery = db
    .select({ id: productColors.id, productId: productColors.productId, name: productColors.name, hex: productColors.hex })
    .from(productColors)
    .innerJoin(products, eq(productColors.productId, products.id))
    .where(where)
    .orderBy(asc(productColors.position));

  const ranked = db
    .select({
      id: productImages.id,
      colorId: productImages.colorId,
      url: productImages.url,
      position: productImages.position,
      rn: sql<number>`row_number() over (partition by ${productImages.colorId} order by ${productImages.position})`.as("rn"),
    })
    .from(productImages)
    .innerJoin(productColors, eq(productImages.colorId, productColors.id))
    .innerJoin(products, eq(productColors.productId, products.id))
    .where(where)
    .as("ranked");
  const imageQuery = db
    .select({ id: ranked.id, colorId: ranked.colorId, url: ranked.url })
    .from(ranked)
    .where(lte(ranked.rn, imagesPerColor))
    .orderBy(asc(ranked.position));

  const [productRows, colorRows, imageRows] = await db.batch([productQuery, colorQuery, imageQuery]);

  const imagesByColor = new Map<string, { id: string; url: string }[]>();
  for (const image of imageRows) {
    const list = imagesByColor.get(image.colorId) ?? [];
    list.push({ id: image.id, url: image.url });
    imagesByColor.set(image.colorId, list);
  }
  const colorsByProduct = new Map<string, GraphColor[]>();
  for (const color of colorRows) {
    const list = colorsByProduct.get(color.productId) ?? [];
    list.push({ id: color.id, name: color.name, hex: color.hex, images: imagesByColor.get(color.id) ?? [] });
    colorsByProduct.set(color.productId, list);
  }
  return productRows.map((row) => ({ ...row, colors: colorsByProduct.get(row.id) ?? [] }));
}
