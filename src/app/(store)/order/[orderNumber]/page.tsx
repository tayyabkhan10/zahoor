import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STORE_NAME } from "@/lib/config";
import { paymentLabel } from "@/lib/policy";
import { formatMoney } from "@/lib/pricing";
import { getOrderByNumber } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = { title: `Order placed | ${STORE_NAME}`, robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      <h1 className="text-4xl text-brand sm:text-5xl">Thank you, {order.customerName.split(" ")[0]}.</h1>
      <p className="mt-4 text-muted">
        Your order <span className="font-semibold text-brand">{order.orderNumber}</span> has been placed. We will
        contact you on {order.phone} to confirm it.
      </p>
      <p className="mt-2 text-sm text-muted">
        Payment: <span className="font-medium text-neutral-900">{paymentLabel(order.paymentMethod)}</span>
        {order.paymentMethod !== "cod" && " · We will share the payment details with you after confirming your order."}
      </p>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-5">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
              {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill sizes="80px" className="object-cover" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-neutral-900">{item.productName}</p>
              <p className="mt-0.5 text-muted">
                {item.colorName}{item.sizeName ? ` · Size ${item.sizeName}` : ""} · Qty {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-brand">{formatMoney(item.unitPriceCents * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatMoney(order.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{order.deliveryCents === 0 ? "Free" : formatMoney(order.deliveryCents)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-4 text-base font-semibold">
          <dt>Total</dt>
          <dd className="text-brand">{formatMoney(order.totalCents)}</dd>
        </div>
      </dl>

      <Link href="/collections/all" className="mt-10 inline-block bg-brand px-9 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-neutral-700">
        Continue shopping
      </Link>
    </div>
  );
}
