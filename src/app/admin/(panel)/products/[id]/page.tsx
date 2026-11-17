import { notFound } from "next/navigation";
import ProductForm, { type ProductFormData } from "@/components/admin/ProductForm";
import { toLocalInput } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { parseMethods, parseSizes } from "@/lib/policy";
import { getProductForAdmin } from "@/lib/products";
import { isUuid } from "@/lib/validators";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const product = await getProductForAdmin(id);
  if (!product) notFound();

  const initial: ProductFormData = {
    name: product.name,
    gender: product.gender,
    category: product.category,
    collection: product.collection ?? "",
    listedFrom: product.listedFrom ?? "",
    description: product.description,
    fabric: product.fabric ?? "",
    fit: product.fit ?? "",
    pieces: product.pieces ?? "",
    care: product.care ?? "",
    badge: product.badge ?? "",
    sizes: parseSizes(product.sizes),
    returnDays: String(product.returnDays),
    paymentMethods: parseMethods(product.paymentMethods),
    price: String(product.priceCents / 100),
    onSale: product.salePriceCents !== null,
    salePrice: product.salePriceCents === null ? "" : String(product.salePriceCents / 100),
    saleEndsAt: toLocalInput(product.saleEndsAt?.toISOString()),
    freeDelivery: product.freeDelivery,
    deliveryFee: String(product.deliveryFeeCents / 100),
    stock: String(product.stock),
    isActive: product.isActive,
    colors: product.colors.map((color) => ({
      id: color.id,
      name: color.name,
      hex: color.hex,
      images: color.images.map((image) => ({ id: image.id, url: image.url, publicId: image.publicId })),
    })),
  };

  return (
    <div>
      <h1 className="text-3xl text-brand">Edit product</h1>
      <div className="mt-8">
        <ProductForm initial={initial} productId={product.id} />
      </div>
    </div>
  );
}
