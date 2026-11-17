"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SORTS } from "@/lib/config";

/** Size, price, availability and sort controls. They only change the URL; the page filters the cached catalog in memory. */
export default function FilterBar({ sizes, total }: { sizes: string[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const activeSize = params.get("size");
  const inStock = params.get("stock") === "1";
  const sort = params.get("sort") ?? "new";

  function go(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() => router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }));
  }

  const hasFilters = Boolean(activeSize || inStock || params.get("min") || params.get("max"));

  return (
    <div className={`border-y border-line py-4 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-sm text-muted">
            {total} {total === 1 ? "product" : "products"}
          </p>

          {sizes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by size">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-neutral-800">Size</span>
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => go({ size: activeSize === size ? null : size })}
                  aria-pressed={activeSize === size}
                  className={`min-w-9 border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    activeSize === size ? "border-brand bg-brand text-white" : "border-line text-neutral-700 hover:border-brand"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              go({ min: min.trim() || null, max: max.trim() || null });
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">Price</span>
            <input
              inputMode="numeric"
              value={min}
              onChange={(event) => setMin(event.target.value.replace(/\D/g, ""))}
              placeholder="Min"
              aria-label="Minimum price"
              className="w-20 border border-line px-2 py-1.5 text-xs outline-none focus:border-brand"
            />
            <span className="text-muted">-</span>
            <input
              inputMode="numeric"
              value={max}
              onChange={(event) => setMax(event.target.value.replace(/\D/g, ""))}
              placeholder="Max"
              aria-label="Maximum price"
              className="w-20 border border-line px-2 py-1.5 text-xs outline-none focus:border-brand"
            />
            <button className="border border-brand px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand hover:bg-brand hover:text-white">Go</button>
          </form>

          <label className="flex items-center gap-2 text-xs font-medium text-neutral-800">
            <input type="checkbox" checked={inStock} onChange={(event) => go({ stock: event.target.checked ? "1" : null })} />
            In stock only
          </label>

          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">Sort</span>
            <select
              value={sort}
              onChange={(event) => go({ sort: event.target.value === "new" ? null : event.target.value })}
              className="border border-line bg-white px-2 py-1.5 text-xs outline-none focus:border-brand"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setMin("");
                setMax("");
                go({ size: null, stock: null, min: null, max: null });
              }}
              className="text-xs text-muted underline underline-offset-4 hover:text-brand"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
