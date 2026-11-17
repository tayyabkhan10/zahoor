"use client";

import { useOptimistic, useTransition } from "react";
import { removeCartItem, updateCartItem } from "@/actions/cart";

type Props = { productId: string; colorId: string; size: string; qty: number; max: number };

function payload({ productId, colorId, size }: Props, quantity: number) {
  const data = new FormData();
  data.set("productId", productId);
  data.set("colorId", colorId);
  data.set("size", size);
  data.set("quantity", String(quantity));
  return data;
}

/** +/- quantity control. Updates instantly and re-prices the whole page (cart, checkout, navbar badge). */
export default function QtyStepper(props: Props) {
  const { qty, max } = props;
  const [pending, startTransition] = useTransition();
  const [shownQty, setShownQty] = useOptimistic(qty);

  function change(next: number) {
    if (next < 1 || next > max || next === shownQty) return;
    startTransition(async () => {
      setShownQty(next);
      await updateCartItem(payload(props, next));
      window.dispatchEvent(new Event("cart:changed"));
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItem(payload(props, 1));
      window.dispatchEvent(new Event("cart:changed"));
    });
  }

  const button =
    "flex h-9 w-9 items-center justify-center text-lg text-brand transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent";

  return (
    <div className="flex items-center gap-4">
      <div className={`inline-flex items-center border border-line ${pending ? "opacity-70" : ""}`}>
        <button type="button" aria-label="Decrease quantity" className={button} disabled={shownQty <= 1} onClick={() => change(shownQty - 1)}>
          −
        </button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
          {shownQty}
        </span>
        <button type="button" aria-label="Increase quantity" className={button} disabled={shownQty >= max} onClick={() => change(shownQty + 1)}>
          +
        </button>
      </div>
      <button type="button" onClick={remove} className="text-sm text-muted underline underline-offset-4 hover:text-brand">
        Remove
      </button>
    </div>
  );
}
