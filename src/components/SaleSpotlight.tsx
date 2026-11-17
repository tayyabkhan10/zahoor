import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog-types";
import { discountPercent, saleEndLabel, saleEndMs } from "@/lib/pricing";
import { ArrowIcon } from "./Icons";
import ProductCard from "./ProductCard";

/** Sale highlight on the home page: biggest discounts first, with the headline "up to X% off" and the nearest end date. */
export default function SaleSpotlight({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) return null;

  const sorted = [...products].sort((a, b) => discountPercent(b) - discountPercent(a));
  const best = discountPercent(sorted[0]);
  const soonest = products
    .filter((product) => saleEndMs(product) !== null)
    .sort((a, b) => (saleEndMs(a) as number) - (saleEndMs(b) as number))[0];

  return (
    <section className="bg-[#fbeeea] py-12 lg:py-16" aria-label="Sale">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Limited time</p>
            <h2 className="mt-2 text-5xl text-accent sm:text-6xl">Sale</h2>
            <p className="mt-2 text-base text-neutral-800">
              Up to <strong>{best}% off</strong> on {products.length} {products.length === 1 ? "style" : "styles"}
              {soonest ? ` · ${saleEndLabel(soonest)}` : ""}
            </p>
          </div>
          <Link
            href="/collections/sale"
            className="inline-flex items-center gap-2 self-start bg-accent px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 sm:self-auto"
          >
            Shop all sale
            <ArrowIcon />
          </Link>
        </div>

        <ul className="no-scrollbar -mx-5 mt-8 flex snap-x gap-3 overflow-x-auto px-5 sm:-mx-8 sm:gap-5 sm:px-8 lg:mx-0 lg:px-0">
          {sorted.slice(0, 8).map((product) => (
            <li key={product.id} className="w-[44vw] shrink-0 snap-start sm:w-56 lg:w-[calc((100%-6rem)/5)]">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
