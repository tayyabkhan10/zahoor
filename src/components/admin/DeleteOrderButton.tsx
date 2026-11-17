"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteOrder } from "@/actions/admin";

export default function DeleteOrderButton({ id, orderNumber }: { id: string; orderNumber: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete order ${orderNumber}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteOrder(id);
      if (!result.ok) {
        window.alert(result.error ?? "Could not delete this order.");
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete order"}
    </button>
  );
}
