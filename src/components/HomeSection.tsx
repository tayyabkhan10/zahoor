import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog-types";
import { ArrowIcon } from "./Icons";
import ProductCard from "./ProductCard";

export default function HomeSection({
  title,
  subtitle,
  links,
  products,
  href,
  total,
}: {
  title: string;
  subtitle: string;
  links: { label: string; href: string }[];
  products: CatalogProduct[];
  href: string;
  total: number;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1500px] px-5 pt-16 sm:px-8 lg:pt-24">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-4xl text-brand sm:text-5xl">{title}</h2>
          <p className="mt-2 text-muted">{subtitle}</p>
        </div>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="whitespace-nowrap border border-line px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 transition-colors hover:border-brand hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href={href}
          className="inline-flex items-center gap-2 border border-brand px-9 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand transition-colors hover:bg-brand hover:text-white"
        >
          Discover {total > products.length ? `${total} more` : "more"}
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
