import "server-only";
import { FREE_DELIVERY_QTY, MAX_QTY, PAYMENT_METHODS } from "./config";
import { readCart } from "./cart";
import { currentPrice, deliveryCost } from "./pricing";
import { parseMethods, parseSizes } from "./policy";
import { getProductsForCart } from "./products";

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  category: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  size: string;
  image: string | null;
  qty: number;
  stock: number;
  unitCents: number;
  originalCents: number;
  lineCents: number;
  freeDelivery: boolean;
  deliveryCents: number;
  paymentMethods: string[];
};

export async function loadCart() {
  const items = await readCart();
  const lines: CartLine[] = [];

  if (items.length > 0) {
    const rows = await getProductsForCart([...new Set(items.map((item) => item.p))]);
    const byId = new Map(rows.map((row) => [row.id, row]));

    for (const item of items) {
      const product = byId.get(item.p);
      if (!product || product.stock < 1) continue;
      const color = product.colors.find((c) => c.id === item.c);
      if (!color) continue;

      // Sized products need one of their sizes; one-size products must have none.
      const sizes = parseSizes(product.sizes);
      if (sizes.length > 0 ? !sizes.includes(item.s) : item.s !== "") continue;

      const qty = Math.min(item.q, product.stock, MAX_QTY);
      const unit = currentPrice(product);

      lines.push({
        key: `${item.p}:${item.c}:${item.s}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        colorId: color.id,
        colorName: color.name,
        colorHex: color.hex,
        size: item.s,
        image: color.images[0]?.url ?? null,
        qty,
        stock: product.stock,
        unitCents: unit,
        originalCents: product.priceCents,
        lineCents: unit * qty,
        freeDelivery: product.freeDelivery,
        deliveryCents: deliveryCost(product),
        paymentMethods: parseMethods(product.paymentMethods),
      });
    }
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  const seen = new Set<string>();
  let deliveryCents = 0;
  for (const line of lines) {
    if (seen.has(line.productId)) continue;
    seen.add(line.productId);
    deliveryCents += line.deliveryCents;
  }

  // Buying FREE_DELIVERY_QTY or more items makes delivery free on the whole order.
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  if (count >= FREE_DELIVERY_QTY) deliveryCents = 0;

  // Only methods accepted by EVERY product in the cart can be used at checkout.
  const methods = PAYMENT_METHODS.filter((m) => lines.every((line) => line.paymentMethods.includes(m)));

  return {
    lines,
    methods,
    subtotalCents,
    deliveryCents,
    totalCents: subtotalCents + deliveryCents,
    count,
    freeDeliveryLeft: Math.max(FREE_DELIVERY_QTY - count, 0),
  };
}
