import { eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog";
import { db } from "@/db";
import { productColors, productImages, products } from "@/db/schema";
import { getAdminId } from "@/lib/auth";
import { deleteImages } from "@/lib/cloudinary";
import { toColorRows, toImageRows, toProductRow } from "@/lib/product-payload";
import { isUuid, issuesToMap, productSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

async function loadExisting(id: string) {
  return db.query.products.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: { colors: { with: { images: true } } },
  });
}

export async function PUT(request: Request, { params }: Context) {
  if (!(await getAdminId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the errors below", fields: issuesToMap(parsed.error.issues) },
      { status: 400 },
    );
  }

  const existing = await loadExisting(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = parsed.data;
  const keepColorIds = new Set(data.colors.map((color) => color.id));
  const keepImageIds = new Set(data.colors.flatMap((color) => color.images.map((image) => image.id)));

  const removedColorIds = existing.colors.filter((color) => !keepColorIds.has(color.id)).map((color) => color.id);
  const removedImages = existing.colors
    .flatMap((color) => color.images)
    .filter((image) => !keepImageIds.has(image.id));

  const statements: [BatchItem<"pg">, ...BatchItem<"pg">[]] = [
    db
      .update(products)
      .set({ ...toProductRow(data), updatedAt: new Date() })
      .where(eq(products.id, id)),
  ];

  if (removedImages.length > 0) {
    statements.push(
      db.delete(productImages).where(
        inArray(
          productImages.id,
          removedImages.map((image) => image.id),
        ),
      ),
    );
  }
  if (removedColorIds.length > 0) {
    statements.push(db.delete(productColors).where(inArray(productColors.id, removedColorIds)));
  }

  statements.push(
    db
      .insert(productColors)
      .values(toColorRows(data, id))
      .onConflictDoUpdate({
        target: productColors.id,
        set: {
          name: sql`excluded.name`,
          hex: sql`excluded.hex`,
          position: sql`excluded.position`,
        },
      }),
    db
      .insert(productImages)
      .values(toImageRows(data))
      .onConflictDoUpdate({
        target: productImages.id,
        set: { position: sql`excluded.position` },
      }),
  );

  await db.batch(statements);
  await deleteImages(removedImages.map((image) => image.publicId));

  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ id });
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await getAdminId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await loadExisting(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const publicIds = existing.colors.flatMap((color) => color.images.map((image) => image.publicId));

  await db.delete(products).where(eq(products.id, id));
  await deleteImages(publicIds);

  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
