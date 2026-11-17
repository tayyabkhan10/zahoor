import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";
import DeleteOrderButton from "@/components/admin/DeleteOrderButton";
import StatusBadge from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_TIMEZONE, ORDER_STATUSES } from "@/lib/config";
import { paymentLabel } from "@/lib/policy";
import { formatMoney } from "@/lib/pricing";
import { getOrderById } from "@/lib/products";
import { isUuid } from "@/lib/validators";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: ADMIN_TIMEZONE,
});

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const order = await getOrderById(id);
  if (!order) notFound();

  const whatsappDigits = order.whatsapp?.replace(/\D/g, "");

  const details: [string, React.ReactNode][] = [
    ["Name", order.customerName],
    ["Phone", <a key="p" href={`tel:${order.phone}`} className="text-brand underline underline-offset-4">{order.phone}</a>],
    [
      "WhatsApp",
      whatsappDigits ? (
        <a key="w" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-4">
          {order.whatsapp}
        </a>
      ) : (
        "Not provided"
      ),
    ],
    ["Other number", order.altPhone ?? "Not provided"],
    ["Email", order.email ?? "Not provided"],
    ["City", order.city],
    ["Address", <span key="a" className="whitespace-pre-line">{order.address}</span>],
    ["Notes", order.notes ?? "None"],
    ["Payment", paymentLabel(order.paymentMethod)],
  ];

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-brand">
        Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-brand">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">{dateFormat.format(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-6 py-4 text-lg font-semibold text-neutral-900">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-5">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-sand">
                    {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-neutral-900">{item.productName}</p>
                    <p className="mt-1 text-muted">
                      {item.colorName}
                      {item.sizeName && <> · Size {item.sizeName}</>}
                    </p>
                    <p className="mt-1 text-muted">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-brand">{formatMoney(item.unitPriceCents * item.quantity)}</p>
                    {item.originalPriceCents > item.unitPriceCents && (
                      <p className="text-muted line-through">{formatMoney(item.originalPriceCents * item.quantity)}</p>
                    )}
                    <p className="mt-1 text-muted">{formatMoney(item.unitPriceCents)} each</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-3 border-t border-line px-6 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>{order.deliveryCents === 0 ? "Free" : formatMoney(order.deliveryCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="text-brand">{formatMoney(order.totalCents)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-8">
          <section className="border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Update status</h2>
            <form action={updateOrderStatus} className="mt-4 flex gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="flex-1 border border-line bg-white px-3 py-3 text-sm capitalize outline-none focus:border-brand"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button className="bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-700">Save</button>
            </form>
          </section>

          <section className="border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Delete order</h2>
            <p className="mt-2 text-sm text-muted">Removes this order and its items permanently.</p>
            <div className="mt-4">
              <DeleteOrderButton id={order.id} orderNumber={order.orderNumber} />
            </div>
          </section>

          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-6 py-4 text-lg font-semibold text-neutral-900">Customer</h2>
            <dl className="divide-y divide-line text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 px-6 py-3.5">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-neutral-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
