import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog";
import { db } from "@/db";
import { productColors, productImages, products } from "@/db/schema";
import { getAdminId } from "@/lib/auth";
import { makeSlug, toColorRows, toImageRows, toProductRow } from "@/lib/product-payload";
import { issuesToMap, productSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!(await getAdminId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the errors below", fields: issuesToMap(parsed.error.issues) },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const id = randomUUID();

  await db.batch([
    db.insert(products).values({ id, slug: makeSlug(data.name), ...toProductRow(data) }),
    db.insert(productColors).values(toColorRows(data, id)),
    db.insert(productImages).values(toImageRows(data)),
  ]);

  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ id }, { status: 201 });
}
