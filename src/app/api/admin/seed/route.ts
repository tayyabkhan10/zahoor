import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog";
import { getAdminId } from "@/lib/auth";
import { removeDemoProducts, seedDemoProducts } from "@/lib/demo-products";

function refresh() {
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

export async function POST() {
  if (!(await getAdminId())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const count = await seedDemoProducts();
  refresh();
  return NextResponse.json({ count });
}

export async function DELETE() {
  if (!(await getAdminId())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const count = await removeDemoProducts();
  refresh();
  return NextResponse.json({ count });
}
