import Image from "next/image";
import Link from "next/link";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { requireAdmin } from "@/lib/auth";
import { currentPrice, deliveryCost, discountPercent, formatMoney, isOnSale } from "@/lib/pricing";
import { listAdminProducts } from "@/lib/products";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await listAdminProducts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl text-brand">Products</h1>
        <Link href="/admin/products/new" className="bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700">
          Add product
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-sand text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Delivery</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted">
                  No products yet. Add your first product.
                </td>
              </tr>
            )}
            {products.map((product) => {
              const image = product.colors[0]?.images[0]?.url;
              const delivery = deliveryCost(product);
              return (
                <tr key={product.id} className="align-middle">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-sand">
                        {image && <Image src={image} alt={product.name} fill sizes="56px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 max-w-md">
                        <p className="line-clamp-2 break-words font-semibold text-neutral-900" title={product.name}>{product.name}</p>
                        <p className="text-muted">
                          {product.gender} · {product.colors.length} {product.colors.length === 1 ? "color" : "colors"}
                        </p>
                        {product.listedFrom && <p className="mt-1 line-clamp-2 break-words text-xs text-amber-700">{product.listedFrom}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted">{product.category}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-brand">{formatMoney(currentPrice(product))}</p>
                    {isOnSale(product) && (
                      <p className="text-xs text-muted">
                        <span className="line-through">{formatMoney(product.priceCents)}</span> · {discountPercent(product)}% off
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted">{delivery === 0 ? "Free" : formatMoney(delivery)}</td>
                  <td className="px-5 py-4">
                    <span className={product.stock < 1 ? "font-semibold text-red-600" : "text-neutral-900"}>{product.stock}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-semibold ${
                        product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {product.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-5">
                      <Link href={`/admin/products/${product.id}`} className="font-medium text-brand underline underline-offset-4">
                        Edit
                      </Link>
                      <DeleteProductButton id={product.id} name={product.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
