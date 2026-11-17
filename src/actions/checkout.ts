"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { clearCart } from "@/lib/cart";
import { CATALOG_TAG } from "@/lib/catalog";
import { rememberOrder } from "@/lib/order-history";
import { loadCart } from "@/lib/cart-lines";
import { getCurrentUser } from "@/lib/user-auth";
import { sendOrderEmails } from "@/lib/mailer";
import { checkoutSchema, issuesToMap } from "@/lib/validators";

export type CheckoutState = {
  errors: Record<string, string>;
  message: string;
  values: Record<string, string>;
};

const FIELDS = ["name", "phone", "whatsapp", "altPhone", "email", "address", "city", "notes", "paymentMethod"] as const;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeOrderNumber() {
  let out = "";
  for (const byte of randomBytes(8)) out += ALPHABET[byte % ALPHABET.length];
  return `ZH-${out}`;
}

export async function placeOrder(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries(FIELDS.map((key) => [key, String(formData.get(key) ?? "").trim()]));

  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: issuesToMap(parsed.error.issues), message: "", values };
  }

  const cart = await loadCart();
  if (cart.lines.length === 0) {
    return { errors: {}, message: "Your cart is empty.", values };
  }

  if (cart.methods.length === 0) {
    return { errors: {}, message: "Some items in your cart accept different payment methods. Please order them separately.", values };
  }
  if (!(cart.methods as readonly string[]).includes(parsed.data.paymentMethod)) {
    return { errors: { paymentMethod: "This payment method is not available for your cart" }, message: "", values };
  }

  const qtyByProduct = new Map<string, { qty: number; stock: number; name: string }>();
  for (const line of cart.lines) {
    const entry = qtyByProduct.get(line.productId) ?? { qty: 0, stock: line.stock, name: line.name };
    entry.qty += line.qty;
    qtyByProduct.set(line.productId, entry);
  }
  for (const entry of qtyByProduct.values()) {
    if (entry.qty > entry.stock) {
      return {
        errors: {},
        message: `Only ${entry.stock} of ${entry.name} left in stock. Please update your cart.`,
        values,
      };
    }
  }

  const data = parsed.data;
  const user = await getCurrentUser();
  const orderId = randomUUID();
  const orderNumber = makeOrderNumber();

  const insertOrder = db.insert(orders).values({
    id: orderId,
    orderNumber,
    userId: user?.id ?? null,
    paymentMethod: data.paymentMethod,
    customerName: data.name,
    phone: data.phone,
    whatsapp: data.whatsapp || null,
    altPhone: data.altPhone || null,
    email: data.email || null,
    address: data.address,
    city: data.city,
    notes: data.notes || null,
    subtotalCents: cart.subtotalCents,
    deliveryCents: cart.deliveryCents,
    totalCents: cart.totalCents,
  });

  const insertItems = db.insert(orderItems).values(
    cart.lines.map((line) => ({
      orderId,
      productId: line.productId,
      productName: line.name,
      colorName: line.colorName,
      colorHex: line.colorHex,
      sizeName: line.size,
      imageUrl: line.image,
      unitPriceCents: line.unitCents,
      originalPriceCents: line.originalCents,
      quantity: line.qty,
    })),
  );

  const stockCases = sql.join(
    [...qtyByProduct.entries()].map(
      ([productId, entry]) => sql`when ${productId}::uuid then ${entry.qty}::int`,
    ),
    sql` `,
  );

  const stockUpdate = db
    .update(products)
    .set({
      stock: sql`greatest(${products.stock} - (case ${products.id} ${stockCases} else 0 end)::int, 0)`,
    })
    .where(inArray(products.id, [...qtyByProduct.keys()]));

  try {
    await db.batch([insertOrder, insertItems, stockUpdate] as unknown as Parameters<typeof db.batch>[0]);
  } catch (error) {
    console.error("placeOrder batch failed", error);
    return { errors: {}, message: "Order place nahi ho saka, please dobara try karein.", values };
  }

  await clearCart();
  await rememberOrder(orderNumber);
  updateTag(CATALOG_TAG);

  after(async () => {
    await sendOrderEmails({
      orderNumber,
      paymentMethod: data.paymentMethod,
      customerName: data.name,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      altPhone: data.altPhone || null,
      email: data.email || null,
      address: data.address,
      city: data.city,
      notes: data.notes || null,
      subtotalCents: cart.subtotalCents,
      deliveryCents: cart.deliveryCents,
      totalCents: cart.totalCents,
      createdAt: new Date(),
      items: cart.lines.map((line) => ({
        productName: line.name,
        colorName: line.colorName,
        sizeName: line.size,
        quantity: line.qty,
        unitPriceCents: line.unitCents,
        imageUrl: line.image,
      })),
    });
  });

  redirect(`/order/${orderNumber}`);
}