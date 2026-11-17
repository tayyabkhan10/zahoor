export const STORE_NAME = "ZAHOOR";
export const STORE_TAGLINE = "Real Fashion, Real Prices";
export const CURRENCY = "PKR";
export const ADMIN_TIMEZONE = "Asia/Karachi";
export const UPLOAD_FOLDER = "zahoor/products";
export const REVIEW_FOLDER = "zahoor/reviews";
export const MAX_REVIEW_IMAGES = 4;
export const MAX_QTY = 10;
export const PRODUCT_NAME_MAX = 255;
export const LISTED_FROM_MAX = 255;
export const PAGE_SIZE = 24;
export const WHATSAPP_NUMBER = "923237376971"; 
export const SUPPORT_EMAIL = "customer.care.zahoor@gmail.com";
export const SUPPORT_PHONE = "+92 323 7376971";
export const FREE_DELIVERY_QTY = 3; 

export const PAYMENT_METHODS = ["cod", "card", "online"] as const;
export const PAYMENT_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cod: "Cash on delivery",
  card: "Card payment",
  online: "Online payment",
};

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
export const KIDS_SIZES = ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"] as const;
export const WAIST_SIZES = ["28", "30", "32", "34", "36", "38", "40"] as const;

export const ALL_SIZES = [...LETTER_SIZES, ...WAIST_SIZES, ...KIDS_SIZES] as const;
export const SIZE_PATTERN = /^[A-Za-z0-9\-\/ ]{1,12}$/;

const PANTS = /pants|trouser|jeans/i;
export function sizesForCategory(gender: string, category: string): readonly string[] {
  if (gender === "Kids") return PANTS.test(category) ? [...KIDS_SIZES, ...WAIST_SIZES.slice(0, 3)] : KIDS_SIZES;
  if (PANTS.test(category)) return WAIST_SIZES;
  return LETTER_SIZES;
}

export const PIECES = ["1 Piece", "2 Piece", "3 Piece"] as const;
export const FITS = ["Regular Fit", "Slim Fit", "Relaxed Fit", "Oversized", "Straight Cut", "A-Line"] as const;
export const BADGES = ["New Arrival", "Best Seller", "Selling Fast", "Few Left", "Trending", "Limited"] as const;

/** Return policy choices shown in the admin product form. "custom" lets the admin type any number of days. */
export const RETURN_PRESETS = [0, 3, 7, 15, 30] as const;

export const SORTS = [
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
