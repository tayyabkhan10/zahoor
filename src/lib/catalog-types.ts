export type CatalogImage = { id: string; url: string };
export type CatalogColor = { id: string; name: string; hex: string; images: CatalogImage[] };

/** Plain JSON-safe product shape (no Date objects) so it can be cached and sent to client components. */
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  gender: string;
  category: string;
  collection: string | null;
  description: string;
  fabric: string | null;
  fit: string | null;
  pieces: string | null;
  care: string | null;
  badge: string | null;
  sizes: string[];
  returnDays: number;
  paymentMethods: string[];
  priceCents: number;
  salePriceCents: number | null;
  saleEndsAtMs: number | null;
  ratingAvg: number;
  ratingCount: number;
  freeDelivery: boolean;
  deliveryFeeCents: number;
  stock: number;
  createdAtMs: number;
  colors: CatalogColor[];
};

export type Filters = {
  gender?: string;
  categories?: string[];
  sale?: boolean;
  newIn?: boolean;
  q?: string;
  sort?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};
