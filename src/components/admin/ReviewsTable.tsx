"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteReviews } from "@/actions/admin";
import Lightbox from "@/components/Lightbox";
import Stars from "@/components/Stars";

export type ReviewRow = {
  id: string;
  productName: string;
  productSlug: string;
  author: string;
  email: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  placed: string;
  images: { id: string; url: string }[];
};

export default function ReviewsTable({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const allSelected = reviews.length > 0 && selected.size === reviews.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function remove(ids: string[], label: string) {
    if (!window.confirm(`Delete ${label}? The review and its photos are removed permanently.`)) return;
    startTransition(async () => {
      const result = await deleteReviews(ids);
      if (!result.ok) window.alert(result.error ?? "Could not delete.");
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(reviews.map((r) => r.id)))} />
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </label>
        {selected.size > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => remove([...selected], `${selected.size} selected ${selected.size === 1 ? "review" : "reviews"}`)}
            className="bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Delete selected ({selected.size})
          </button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-line border border-line bg-white">
        {reviews.length === 0 && <li className="px-6 py-12 text-center text-muted">No reviews yet.</li>}
        {reviews.map((review) => (
          <li key={review.id} className={`flex gap-4 px-5 py-5 ${selected.has(review.id) ? "bg-amber-50" : ""}`}>
            <input type="checkbox" className="mt-1" aria-label={`Select review by ${review.author}`} checked={selected.has(review.id)} onChange={() => toggle(review.id)} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={review.rating} />
                {review.verified ? (
                  <span className="bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Verified buyer</span>
                ) : (
                  <span className="bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">Not a buyer</span>
                )}
                <Link href={`/products/${review.productSlug}#reviews`} target="_blank" className="text-sm font-medium text-brand underline underline-offset-4">
                  {review.productName}
                </Link>
              </div>
              {review.title && <p className="mt-2 font-semibold text-neutral-900">{review.title}</p>}
              <p className="mt-1 whitespace-pre-line break-words text-sm text-neutral-700">{review.body}</p>
              {review.images.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {review.images.map((image, index) => (
                    <li key={image.id}>
                      <button
                        type="button"
                        onClick={() => setViewer({ images: review.images.map((i) => i.url), index })}
                        aria-label="View photo full screen"
                        className="relative block h-16 w-16 cursor-zoom-in overflow-hidden bg-sand ring-1 ring-line hover:ring-brand"
                      >
                        <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted">
                {review.author} · {review.email || "no email"} · {review.placed}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove([review.id], "this review")}
              className="h-fit shrink-0 text-sm font-medium text-red-600 underline underline-offset-4 disabled:opacity-50"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {viewer && (
        <Lightbox
          images={viewer.images.map((url) => ({ url }))}
          index={viewer.index}
          onIndex={(index) => setViewer({ ...viewer, index })}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
