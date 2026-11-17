import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { loadProductGraph } from "./product-graph";

export async function getProductsForCart(ids: string[]) {
  if (ids.length === 0) return [];
  // One batched round trip, first image of each color only.
  return loadProductGraph(and(inArray(products.id, ids), eq(products.isActive, true)), 1);
}

export async function listAdminProducts() {
  // Flat batched queries (no nested lateral joins), first image of each color only, hidden products included.
  return loadProductGraph(undefined, 1);
}

export async function getProductForAdmin(id: string) {
  return db.query.products.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: {
      colors: {
        orderBy: (c, { asc }) => [asc(c.position)],
        with: { images: { orderBy: (i, { asc }) => [asc(i.position)] } },
      },
    },
  });
}

export async function listOrders() {
  return db.query.orders.findMany({
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 100,
    with: { items: { columns: { productName: true, quantity: true } } },
  });
}

export async function getOrderStats() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`(count(*) filter (where ${orders.status} = 'pending'))::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)::int`,
    })
    .from(orders);
  return row;
}

export async function getOrderById(id: string) {
  return db.query.orders.findFirst({
    where: (o, { eq }) => eq(o.id, id),
    with: { items: true },
  });
}

export async function getOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: (o, { eq }) => eq(o.orderNumber, orderNumber),
    with: { items: true },
  });
}

const orderWith = { items: true } as const;

/** Looks up orders by phone number. Matches the last 10 digits so 0300..., +92300... and 92300... all match. */
export async function findOrdersByPhone(phoneDigits: string) {
  const last10 = phoneDigits.slice(-10);
  if (last10.length < 7) return [];
  const pattern = `%${last10}`;
  const clean = (col: unknown) => sql`regexp_replace(coalesce(${col}, ''), '\\D', '', 'g')`;
  return db.query.orders.findMany({
    where: sql`${clean(orders.phone)} like ${pattern} or ${clean(orders.whatsapp)} like ${pattern} or ${clean(orders.altPhone)} like ${pattern}`,
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 20,
    with: orderWith,
  });
}

export async function findOrdersByNumbers(orderNumbers: string[]) {
  if (orderNumbers.length === 0) return [];
  return db.query.orders.findMany({
    where: (o, { inArray }) => inArray(o.orderNumber, orderNumbers.slice(0, 30)),
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    with: orderWith,
  });
}

export async function listOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: (o, { eq }) => eq(o.userId, userId),
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 50,
    with: orderWith,
  });
}