import Image from "next/image";
import Link from "next/link";
import { ADMIN_TIMEZONE } from "@/lib/config";
import { paymentLabel } from "@/lib/policy";
import { formatMoney } from "@/lib/pricing";

const STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;
const LABELS: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  shipped: "On the way",
  delivered: "Delivered",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: ADMIN_TIMEZONE });

type OrderData = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  totalCents: number;
  items: { id: string; productName: string; colorName: string; sizeName: string; quantity: number; unitPriceCents: number; imageUrl: string | null }[];
};

/** One order in the history list: order number, date, progress, items and total. */
export default function OrderCard({ order }: { order: OrderData }) {
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "cancelled";

  return (
    <article className="border border-line">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-sand px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Order number</p>
          <p className="font-serif text-lg text-brand">{order.orderNumber}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-muted">{dateFormat.format(order.createdAt)}</p>
          <p className="mt-1 font-semibold text-brand">{formatMoney(order.totalCents)}</p>
          <p className="text-xs text-muted">{paymentLabel(order.paymentMethod)}</p>
        </div>
      </header>

      <div className="px-5 py-5">
        {cancelled ? (
          <p className="text-sm font-medium text-neutral-700">This order was cancelled.</p>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((step, index) => (
              <li key={step} className="text-center">
                <span
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    index <= stepIndex ? "bg-brand text-white" : "bg-sand text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`mt-2 block text-[11px] sm:text-xs ${index <= stepIndex ? "font-semibold text-brand" : "text-muted"}`}>
                  {LABELS[step]}
                </span>
              </li>
            ))}
          </ol>
        )}

        <ul className="mt-6 divide-y divide-line border-t border-line text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sand">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
              </span>
              <span className="flex-1">
                {item.productName}
                <span className="block text-xs text-muted">
                  {item.colorName}{item.sizeName ? ` · Size ${item.sizeName}` : ""} · Qty {item.quantity}
                </span>
              </span>
              <span className="font-medium">{formatMoney(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <Link href={`/order/${order.orderNumber}`} className="mt-4 inline-block text-sm text-muted underline underline-offset-4 hover:text-brand">
          View full receipt
        </Link>
      </div>
    </article>
  );
}
