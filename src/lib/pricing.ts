type Priced = {
  priceCents: number;
  salePriceCents: number | null;
  /** Optional end of the sale (milliseconds), as used by the cached catalog. */
  saleEndsAtMs?: number | null;
  /** Optional end of the sale as a Date, as stored in the database. */
  saleEndsAt?: Date | null;
};
type Delivered = { freeDelivery: boolean; deliveryFeeCents: number };

const grouped = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Amounts are stored as "cents" (rupees x 100). Output looks like "Rs.2,190". */
export function formatMoney(cents: number) {
  return `Rs.${grouped.format(Math.round(cents / 100))}`;
}

export function saleEndMs(p: Priced) {
  return p.saleEndsAtMs ?? p.saleEndsAt?.getTime() ?? null;
}

/** On sale = a lower sale price exists AND the sale has not ended yet. */
export function isOnSale(p: Priced) {
  if (p.salePriceCents === null || p.salePriceCents >= p.priceCents) return false;
  const end = saleEndMs(p);
  return end === null || end > Date.now();
}

export function currentPrice(p: Priced) {
  return isOnSale(p) ? (p.salePriceCents as number) : p.priceCents;
}

export function discountPercent(p: Priced) {
  if (!isOnSale(p)) return 0;
  return Math.round((1 - (p.salePriceCents as number) / p.priceCents) * 100);
}

export function deliveryCost(p: Delivered) {
  return p.freeDelivery ? 0 : p.deliveryFeeCents;
}

const endFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" });

/** "Ends 20 Oct", or null when the sale has no end date. */
export function saleEndLabel(p: Priced) {
  const end = saleEndMs(p);
  return end === null ? null : `Ends ${endFormat.format(end)}`;
}
