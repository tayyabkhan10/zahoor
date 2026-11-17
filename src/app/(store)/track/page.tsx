import Link from "next/link";
import OrderCard from "@/components/OrderCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { STORE_NAME } from "@/lib/config";
import { readOrderHistory } from "@/lib/order-history";
import { findOrdersByNumbers, findOrdersByPhone, getOrderByNumber } from "@/lib/products";

export const dynamic = "force-dynamic";
export const metadata = { title: `Track order | ${STORE_NAME}` };

/** Accepts "ZH-ABCD1234", "zhabcd1234" or just "ABCD1234". */
function normalizeOrderNumber(value: string) {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length === 10 && raw.startsWith("ZH")) return `ZH-${raw.slice(2)}`;
  if (raw.length === 8) return `ZH-${raw}`;
  return null;
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const { order: orderInput = "", phone: phoneInput = "" } = await searchParams;
  const phoneDigits = phoneInput.replace(/\D/g, "");
  const orderNumber = orderInput.trim() ? normalizeOrderNumber(orderInput) : null;
  const searched = Boolean(orderInput.trim() || phoneInput.trim());

  // Either one is enough. If both are given, they have to belong to the same order.
  let results: Awaited<ReturnType<typeof findOrdersByPhone>> = [];
  if (orderInput.trim()) {
    const found = orderNumber ? await getOrderByNumber(orderNumber) : null;
    if (found) {
      const phoneOk = phoneDigits.length < 7 || [found.phone, found.whatsapp, found.altPhone].some((value) => (value ?? "").replace(/\D/g, "").endsWith(phoneDigits.slice(-10)));
      if (phoneOk) results = [found];
    }
  } else if (phoneDigits.length >= 7) {
    results = await findOrdersByPhone(phoneDigits);
  }

  // Orders placed from this browser, shown as history even without searching.
  const history = await readOrderHistory();
  const shown = new Set(results.map((order) => order.orderNumber));
  const myOrders = (await findOrdersByNumbers(history.filter((value) => !shown.has(value)))).filter((order) => !shown.has(order.orderNumber));

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      <h1 className="text-3xl text-brand sm:text-4xl">Track your order</h1>
      <p className="mt-3 text-muted">
        Track an order with its order number (like ZH-XXXXXXXX) <strong className="font-semibold text-brand">or</strong> with the phone
        number you used at checkout. One of them is enough.
      </p>

      <form className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <input
          name="order"
          defaultValue={orderInput}
          placeholder="Order number (optional)"
          aria-label="Order number"
          className="border border-line px-4 py-3 text-sm uppercase outline-none placeholder:normal-case focus:border-brand"
        />
        <input
          name="phone"
          type="tel"
          defaultValue={phoneInput}
          placeholder="Phone number (optional)"
          aria-label="Phone number"
          className="border border-line px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <button className="bg-brand px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-700">Track</button>
      </form>

      {searched && results.length === 0 && (
        <p className="mt-8 border border-line bg-sand px-5 py-4 text-sm text-neutral-700">
          No order found. Check the order number or phone number and try again.
        </p>
      )}

      {results.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg text-brand">
            {results.length === 1 ? "Your order" : `${results.length} orders found`}
          </h2>
          <div className="mt-5 space-y-5">
            {results.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}

      {myOrders.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg text-brand">Orders from this device</h2>
          <p className="mt-1 text-sm text-muted">Every order you placed in this browser, newest first.</p>
          <div className="mt-5 space-y-5">
            {myOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}

      {!searched && myOrders.length === 0 && (
        <p className="mt-10 text-sm text-muted">You have no orders on this device yet.</p>
      )}

      <Link href="/collections/all" className="mt-12 inline-block text-sm text-muted underline underline-offset-4 hover:text-brand">
        Continue shopping
      </Link>
      <WhatsAppButton />
    </div>
  );
}
