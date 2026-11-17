"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${name}"? Its images will also be removed from Cloudinary.`)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      window.alert("Could not delete this product.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="font-medium text-red-600 underline underline-offset-4 disabled:opacity-50"
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
