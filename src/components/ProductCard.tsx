import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog-types";
import { BLUR } from "@/lib/blur";
import { currentPrice, discountPercent, formatMoney, isOnSale } from "@/lib/pricing";
import Stars from "./Stars";

export default function ProductCard({ product, priority = false }: { product: CatalogProduct; priority?: boolean }) {
  const firstColor = product.colors[0];
  const primary = firstColor?.images[0]?.url;
  const hover = firstColor?.images[1]?.url;
  const href = `/products/${product.slug}`;
  const onSale = isOnSale(product);
  const soldOut = product.stock < 1;
  const tag = soldOut ? "Sold out" : onSale ? `-${discountPercent(product)}%` : product.badge;

  return (
    <article className="group flex h-full w-full flex-col">
      <Link href={href} className="relative block aspect-[3/4] overflow-hidden bg-sand" aria-label={product.name}>
        {primary && (
          <Image
            src={primary}
            alt={product.name}
            fill
            priority={priority}
            placeholder="blur"
            blurDataURL={BLUR}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            className={`object-cover transition-opacity duration-500 ${hover ? "group-hover:opacity-0" : ""}`}
          />
        )}
        {hover && (
          <Image
            src={hover}
            alt=""
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:block"
          />
        )}
        {tag && (
          <span
            className={`absolute left-2 top-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white sm:left-3 sm:top-3 sm:text-[11px] ${
              soldOut ? "bg-neutral-900" : onSale ? "bg-accent" : "bg-brand"
            }`}
          >
            {tag}
          </span>
        )}
        {product.sizes.length > 0 && !soldOut && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-full bg-white/95 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-neutral-800 transition-transform duration-300 group-hover:translate-y-0 lg:block"
          >
            {product.sizes.join(" · ")}
          </span>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <Link href={href} title={product.name} className="line-clamp-2 break-words text-sm font-medium leading-snug text-neutral-900 hover:underline sm:text-[15px]">
          {product.name}
        </Link>
        <p className="mt-1 text-xs text-muted">{product.collection ?? product.category}</p>
        {product.ratingCount > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <Stars value={product.ratingAvg} className="h-3.5 w-3.5" />
            <span>({product.ratingCount})</span>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className={`text-sm font-semibold sm:text-base ${onSale ? "text-accent" : "text-brand"}`}>{formatMoney(currentPrice(product))}</span>
          {onSale && <span className="text-xs text-muted line-through sm:text-sm">{formatMoney(product.priceCents)}</span>}
        </div>

        {product.colors.length > 1 && (
          <ul className="mt-2.5 flex items-center gap-1.5" aria-label="Available colors">
            {product.colors.slice(0, 6).map((color) => (
              <li key={color.id}>
                <Link
                  href={`${href}?color=${color.id}`}
                  title={color.name}
                  aria-label={color.name}
                  className="block h-3.5 w-3.5 rounded-full ring-1 ring-black/15 ring-offset-1 transition hover:ring-brand"
                  style={{ backgroundColor: color.hex }}
                />
              </li>
            ))}
            {product.colors.length > 6 && <li className="text-[11px] text-muted">+{product.colors.length - 6}</li>}
          </ul>
        )}
      </div>
    </article>
  );
}
