import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { productImages } from "@/db/schema";
import { getAdminId } from "@/lib/auth";
import { deleteImages } from "@/lib/cloudinary";
import { imageDeleteSchema } from "@/lib/validators";

export async function DELETE(request: Request) {
  if (!(await getAdminId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = imageDeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { publicIds } = parsed.data;
  await db.delete(productImages).where(inArray(productImages.publicId, publicIds));
  await deleteImages(publicIds);

  return NextResponse.json({ ok: true });
}
