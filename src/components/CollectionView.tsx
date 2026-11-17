import Link from "next/link";
import { Suspense } from "react";
import type { CatalogProduct, Filters } from "@/lib/catalog-types";
import { filterCatalog, sizesOf } from "@/lib/catalog-utils";
import { PAGE_SIZE, SORTS } from "@/lib/config";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";

export type Chip = { label: string; href: string; active?: boolean };

export type RawParams = { [key: string]: string | string[] | undefined };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the URL query (?size=M&min=1000&sort=price-asc&page=2) into catalog filters. */
export function readFilters(raw: RawParams, base: Filters): { filters: Filters; page: number } {
  const sort = first(raw.sort);
  const min = Number(first(raw.min));
  const max = Number(first(raw.max));
  const page = Math.max(1, Math.floor(Number(first(raw.page))) || 1);
  return {
    page,
    filters: {
      ...base,
      sort: SORTS.some((option) => option.value === sort) ? sort : "new",
      size: first(raw.size)?.slice(0, 12) || undefined,
      minPrice: Number.isFinite(min) && min > 0 ? min : undefined,
      maxPrice: Number.isFinite(max) && max > 0 ? max : undefined,
      inStock: first(raw.stock) === "1" || undefined,
    },
  };
}

function pageHref(basePath: string, raw: RawParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const v = first(value);
    if (v && key !== "page") params.set(key, v);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

export default function CollectionView({
  title,
  description,
  crumbs,
  chips,
  catalog,
  filters,
  page,
  basePath,
  raw,
}: {
  title: string;
  description?: string;
  crumbs: { label: string; href?: string }[];
  chips?: Chip[];
  /** Products that match the collection itself (before size / price filters). */
  catalog: CatalogProduct[];
  filters: Filters;
  page: number;
  basePath: string;
  raw: RawParams;
}) {
  const visible = filterCatalog(catalog, filters);
  const sizes = sizesOf(catalog);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-12">
      <nav className="text-xs text-muted" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => (
          <span key={crumb.label}>
            {index > 0 && <span className="mx-2">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-brand">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-neutral-900">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <h1 className="mt-4 text-4xl text-brand sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-muted">{description}</p>}

      {chips && chips.length > 0 && (
        <div className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`whitespace-nowrap border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                chip.active ? "border-brand bg-brand text-white" : "border-line text-neutral-700 hover:border-brand hover:text-brand"
              }`}
            >
              {chip.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Suspense fallback={<div className="h-14 border-y border-line" />}>
          <FilterBar sizes={sizes} total={visible.length} />
        </Suspense>
      </div>

      {slice.length === 0 ? (
        <div className="mt-10 border border-line bg-sand px-6 py-20 text-center">
          <p className="text-xl font-medium text-brand">No products found</p>
          <p className="mt-2 text-sm text-muted">Try removing a filter or search for something else.</p>
          <Link href="/collections/all" className="mt-6 inline-block border-b border-brand pb-0.5 text-sm font-semibold uppercase tracking-wider text-brand">
            View all products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12 xl:grid-cols-4">
          {slice.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-14 flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
          {current > 1 && (
            <Link href={pageHref(basePath, raw, current - 1)} className="border border-line px-4 py-2 hover:border-brand">
              Previous
            </Link>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1)
            .map((n, index, list) => (
              <span key={n} className="flex items-center gap-2">
                {index > 0 && n - list[index - 1] > 1 && <span className="text-muted">…</span>}
                <Link
                  href={pageHref(basePath, raw, n)}
                  aria-current={n === current ? "page" : undefined}
                  className={`min-w-10 border px-3 py-2 text-center ${n === current ? "border-brand bg-brand text-white" : "border-line hover:border-brand"}`}
                >
                  {n}
                </Link>
              </span>
            ))}
          {current < pages && (
            <Link href={pageHref(basePath, raw, current + 1)} className="border border-line px-4 py-2 hover:border-brand">
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
