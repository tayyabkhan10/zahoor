import Image from "next/image";
import Link from "next/link";
import QtyStepper from "@/components/QtyStepper";
import { MAX_QTY } from "@/lib/config";
import { loadCart } from "@/lib/cart-lines";
import { FREE_DELIVERY_QTY, STORE_NAME } from "@/lib/config";
import { getUserId } from "@/lib/user-auth";
import { formatMoney } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata = { title: `Your cart | ${STORE_NAME}` };

export default async function CartPage() {
  const [cart, userId] = await Promise.all([loadCart(), getUserId()]);

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h1 className="text-4xl text-brand">Your cart is empty</h1>
        <p className="mt-4 text-muted">Pick something you like and it will show up here.</p>
        {!userId && (
          <p className="mt-2 text-sm text-muted">
            Have an account?{" "}
            <Link href="/login?next=/cart" className="text-brand underline underline-offset-4">
              Sign in
            </Link>{" "}
            to see your saved cart.
          </p>
        )}
        <Link href="/collections/all" className="mt-8 inline-block bg-brand px-9 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-neutral-700">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <h1 className="text-4xl text-brand sm:text-5xl">Your cart</h1>
      {!userId && (
        <p className="mt-3 text-sm text-muted">
          Have an account?{" "}
          <Link href="/login?next=/cart" className="text-brand underline underline-offset-4">
            Log in
          </Link>{" "}
          to check out faster and save your cart.
        </p>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-6 sm:gap-6">
              <Link
                href={`/products/${line.slug}?color=${line.colorId}`}
                className="relative block h-28 w-24 shrink-0 overflow-hidden bg-sand sm:h-36 sm:w-28"
              >
                {line.image && <Image src={line.image} alt={line.name} fill sizes="120px" className="object-cover" />}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/products/${line.slug}?color=${line.colorId}`} className="text-base font-semibold text-neutral-900">
                      {line.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      {line.colorName}
                      {line.size && <> · Size {line.size}</>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-brand">{formatMoney(line.lineCents)}</p>
                    {line.originalCents > line.unitCents && (
                      <p className="text-sm text-muted line-through">{formatMoney(line.originalCents * line.qty)}</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <QtyStepper productId={line.productId} colorId={line.colorId} size={line.size} qty={line.qty} max={Math.min(line.stock, MAX_QTY)} />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-line bg-sand p-6">
          <h2 className="text-2xl text-brand">Order summary</h2>
          {cart.deliveryCents > 0 && cart.freeDeliveryLeft > 0 && (
            <p className="mt-4 bg-white px-4 py-3 text-xs text-neutral-700">
              Add {cart.freeDeliveryLeft} more {cart.freeDeliveryLeft === 1 ? "item" : "items"} to get <strong>free delivery</strong>.
            </p>
          )}
          <dl className="mt-6 space-y-3 text-sm">
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
          <Link
            href="/checkout"
            className="mt-6 block bg-brand py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-700"
          >
            Checkout
          </Link>
          <Link href="/collections/all" className="mt-4 block text-center text-sm text-muted underline underline-offset-4 hover:text-brand">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
