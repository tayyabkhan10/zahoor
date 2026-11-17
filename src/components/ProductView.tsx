"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BLUR } from "@/lib/blur";
import { addToCart, buyNow } from "@/actions/cart";
import type { CatalogProduct } from "@/lib/catalog-types";
import { MAX_QTY } from "@/lib/config";
import { paymentLabel, returnLabel } from "@/lib/policy";
import { currentPrice, deliveryCost, discountPercent, formatMoney, isOnSale, saleEndLabel } from "@/lib/pricing";
import ColorDots from "./ColorDots";
const Lightbox = dynamic(() => import("./Lightbox"), { ssr: false });
import Stars from "./Stars";
import { ReturnIcon, ShieldIcon, TruckIcon } from "./Icons";

/** Gallery + buy box. Color, size, image and quantity change instantly in the browser, with no page reload. */
type Rating = { avg: number; count: number };

export default function ProductView({ product, initialColorId, rating }: { product: CatalogProduct; initialColorId?: string; rating?: Rating }) {
  const first = product.colors[0];
  const [colorId, setColorId] = useState(
    initialColorId && product.colors.some((c) => c.id === initialColorId) ? initialColorId : first?.id,
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [viewer, setViewer] = useState(false);

  const color = product.colors.find((c) => c.id === colorId) ?? first;
  if (!color) return null;

  const image = color.images[Math.min(imageIndex, Math.max(color.images.length - 1, 0))];
  const onSale = isOnSale(product);
  const delivery = deliveryCost(product);
  const soldOut = product.stock < 1;
  const maxQty = Math.min(product.stock, MAX_QTY);
  const needsSize = product.sizes.length > 0;

  function requireSize(event: React.MouseEvent<HTMLButtonElement>) {
    if (needsSize && !size) {
      event.preventDefault();
      setSizeError(true);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-14">
      <div className="grid gap-3 lg:sticky lg:top-36 lg:grid-cols-[84px_1fr]">
        {color.images.length > 1 && (
          <ul className="no-scrollbar order-2 flex gap-2 overflow-x-auto lg:order-1 lg:max-h-[42rem] lg:flex-col lg:overflow-y-auto">
            {color.images.map((item, index) => (
              <li key={item.id} className="w-16 shrink-0 lg:w-full">
                <button
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Image ${index + 1}`}
                  className={`relative block aspect-[3/4] w-full overflow-hidden bg-sand ${
                    item.id === image?.id ? "ring-2 ring-brand ring-offset-1" : "ring-1 ring-line"
                  }`}
                >
                  <Image src={item.url} alt="" fill sizes="90px" placeholder="blur" blurDataURL={BLUR} className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative order-1 aspect-[3/4] overflow-hidden bg-sand lg:order-2">
          {image && (
            <Image
              key={image.id}
              src={image.url}
              alt={`${product.name} in ${color.name}`}
              fill
              priority
              placeholder="blur"
              blurDataURL={BLUR}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          )}
          {image && (
            <button
              type="button"
              onClick={() => setViewer(true)}
              aria-label="View image full screen"
              className="absolute inset-0 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
            >
              <span className="absolute bottom-3 right-3 bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-800 shadow-sm">
                Full view
              </span>
            </button>
          )}
          {onSale && !soldOut && (
            <span className="absolute left-4 top-4 bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
              -{discountPercent(product)}%
            </span>
          )}
        </div>
      </div>

      <div>
        {product.badge && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{product.badge}</p>}
        <p className="mt-1 text-sm text-muted">
          {product.gender} · {product.collection ?? product.category}
        </p>
        <h1 className={`mt-2 break-words leading-tight text-brand ${product.name.length > 90 ? "text-xl sm:text-2xl" : product.name.length > 45 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>{product.name}</h1>
        {rating && rating.count > 0 && (
          <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
            <Stars value={rating.avg} className="h-4 w-4" />
            <span>
              {rating.avg.toFixed(1)} · {rating.count} {rating.count === 1 ? "review" : "reviews"}
            </span>
          </a>
        )}

        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-2xl font-semibold ${onSale ? "text-accent" : "text-brand"}`}>{formatMoney(currentPrice(product))}</span>
          {onSale && (
            <>
              <span className="text-lg text-muted line-through">{formatMoney(product.priceCents)}</span>
              <span className="bg-accent/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent">Save {discountPercent(product)}%</span>
            </>
          )}
        </div>
        {onSale && saleEndLabel(product) && <p className="mt-2 text-sm font-semibold text-accent">Sale · {saleEndLabel(product)}</p>}
        <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

        <form className="mt-7">
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="colorId" value={color.id} />
          <input type="hidden" name="size" value={size} />

          {product.colors.length > 1 && (
            <>
              <p className="text-sm font-medium text-neutral-900">
                Colour: <span className="font-normal text-muted">{color.name}</span>
              </p>
              <div className="mt-3">
                <ColorDots
                  colors={product.colors}
                  activeId={color.id}
                  size={52}
                  onSelect={(id) => {
                    setColorId(id);
                    setImageIndex(0);
                  }}
                />
              </div>
            </>
          )}

          {needsSize && !soldOut && (
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-900">
                  Size: <span className="font-normal text-muted">{size || "Select a size"}</span>
                </p>
                <Link href="/pages/size-guide" target="_blank" className="text-xs text-muted underline underline-offset-4 hover:text-brand">
                  Size guide
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                {product.sizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={size === item}
                    onClick={() => {
                      setSize(item);
                      setSizeError(false);
                    }}
                    className={`min-w-12 border px-4 py-3 text-sm font-medium transition-colors ${
                      size === item ? "border-brand bg-brand text-white" : "border-line text-neutral-800 hover:border-brand"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p role="alert" className="mt-2 text-sm font-medium text-accent">
                  Please select a size first.
                </p>
              )}
            </div>
          )}

          {soldOut ? (
            <p className="mt-8 border border-line bg-sand px-5 py-4 text-sm font-medium text-neutral-700">This item is currently sold out.</p>
          ) : (
            <>
              {product.stock <= 5 && <p className="mt-6 text-sm font-medium text-accent">Hurry, only {product.stock} left in stock</p>}

              <label className="mt-6 block text-sm font-medium text-neutral-900">
                Quantity
                <select
                  name="quantity"
                  value={Math.min(qty, maxQty)}
                  onChange={(event) => setQty(Number(event.target.value))}
                  className="mt-2 block w-28 border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand"
                >
                  {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  formAction={addToCart}
                  onClick={requireSize}
                  className="border border-brand py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  Add to cart
                </button>
                <button
                  formAction={buyNow}
                  onClick={requireSize}
                  className="bg-brand py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-700"
                >
                  Buy it now
                </button>
              </div>
            </>
          )}
        </form>

        <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
          <li className={`flex items-center gap-3 ${delivery === 0 ? "font-medium text-neutral-900" : "text-neutral-700"}`}>
            <TruckIcon className="h-5 w-5 text-brand" />
            {delivery === 0 ? "Free delivery" : `Delivery ${formatMoney(delivery)}`}
          </li>
          <li className="flex items-center gap-3 text-neutral-700">
            <ReturnIcon className="h-5 w-5 text-brand" />
            {returnLabel(product.returnDays)}
          </li>
          <li className="flex items-center gap-3 text-neutral-700">
            <ShieldIcon className="h-5 w-5 text-brand" />
            {product.paymentMethods.map(paymentLabel).join(" · ")}
          </li>
        </ul>
      </div>

      {viewer && color.images.length > 0 && (
        <Lightbox
          images={color.images.map((item) => ({ url: item.url, alt: `${product.name} in ${color.name}` }))}
          index={Math.min(imageIndex, color.images.length - 1)}
          onIndex={setImageIndex}
          onClose={() => setViewer(false)}
        />
      )}
    </div>
  );
}

/** Opens on the color from the link (?color=...) the customer clicked on a product card. */
export function ProductViewFromUrl({ product, rating }: { product: CatalogProduct; rating?: Rating }) {
  const initial = useSearchParams().get("color") ?? undefined;
  return <ProductView key={initial ?? "default"} product={product} initialColorId={initial} rating={rating} />;
}
