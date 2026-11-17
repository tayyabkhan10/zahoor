import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import QtyStepper from "@/components/QtyStepper";
import WhatsAppButton from "@/components/WhatsAppButton";
import { MAX_QTY } from "@/lib/config";
import { loadCart } from "@/lib/cart-lines";
import { formatMoney } from "@/lib/pricing";
import { STORE_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export const metadata = { title: `Checkout | ${STORE_NAME}` };

export default async function CheckoutPage() {
  const [cart, user] = await Promise.all([loadCart(), getCurrentUser()]);
  if (cart.lines.length === 0) redirect("/cart");

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <h1 className="text-4xl text-brand sm:text-5xl">Checkout</h1>
      <p className="mt-3 text-muted">
        {user ? (
          <>Signed in as <span className="font-medium text-brand">{user.email}</span>. Your order will be saved to your account.</>
        ) : (
          <>
            Fields marked with * are required. Checking out as a guest.{" "}
            <Link href="/login?next=/checkout" className="text-brand underline underline-offset-4">
              Sign in
            </Link>{" "}
            to check out faster.
          </>
        )}
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        <CheckoutForm methods={cart.methods} defaults={user ? { name: user.name, phone: user.phone ?? "", email: user.email } : undefined} />

        <aside className="order-first h-fit border border-line bg-sand p-6 lg:order-last">
          <h2 className="text-2xl text-brand">Your order</h2>
          <ul className="mt-6 divide-y divide-line">
            {cart.lines.map((line) => (
              <li key={line.key} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-white">
                  {line.image && <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-neutral-900">{line.name}</p>
                  <p className="mt-0.5 text-muted">
                    {line.colorName}
                    {line.size && <> · Size {line.size}</>}
                  </p>
                  <div className="mt-2">
                    <QtyStepper productId={line.productId} colorId={line.colorId} size={line.size} qty={line.qty} max={Math.min(line.stock, MAX_QTY)} />
                  </div>
                </div>
                <p className="text-sm font-semibold text-brand">{formatMoney(line.lineCents)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">{formatMoney(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-medium">{cart.deliveryCents === 0 ? "Free" : formatMoney(cart.deliveryCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-4 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold text-brand">{formatMoney(cart.totalCents)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">Prices are in PKR. Choose your payment method on the form.</p>
          <Link href="/cart" className="mt-4 block text-sm text-muted underline underline-offset-4 hover:text-brand">
            Edit cart
          </Link>
        </aside>
      </div>
      <WhatsAppButton />
    </div>
  );
}
