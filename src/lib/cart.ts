import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems } from "@/db/schema";
import { MAX_QTY, SIZE_PATTERN } from "./config";
import { getUserId } from "./user-auth";

/** p = product id, c = color id, s = size ("" for one-size items), q = quantity */
export type CartItem = { p: string; c: string; s: string; q: number };

const COOKIE = "zh_cart";
/** Readable (non-httpOnly) item count, so the navbar badge can show it without making every page dynamic. */
const COUNT_COOKIE = "zh_n";
const MAX_LINES = 20;
const idPattern = /^[0-9a-f-]{36}$/i;

function clean(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    if (!idPattern.test(item.p) || !idPattern.test(item.c) || !SIZE_PATTERN.test(item.s || "x")) continue;
    if (!Number.isFinite(item.q) || item.q < 1) continue;
    const key = `${item.p}:${item.c}:${item.s}`;
    const existing = merged.get(key);
    const q = Math.min(Math.floor(item.q), MAX_QTY);
    if (existing) existing.q = Math.min(existing.q + q, MAX_QTY);
    else merged.set(key, { p: item.p, c: item.c, s: item.s, q });
  }
  return [...merged.values()].slice(0, MAX_LINES);
}

const cookieBase = () => ({
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
});

async function readGuestCart(): Promise<CartItem[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return clean(
      parsed
        .filter((item) => typeof item === "object" && item !== null)
        .map((item) => ({
          p: String(item.p ?? ""),
          c: String(item.c ?? ""),
          s: String(item.s ?? ""),
          q: Number(item.q),
        })),
    );
  } catch {
    return [];
  }
}

async function setCount(items: CartItem[]) {
  (await cookies()).set(COUNT_COOKIE, String(items.reduce((sum, item) => sum + item.q, 0)), { ...cookieBase(), httpOnly: false });
}

/** Signed-in customers: the cart lives in the database (follows them across devices). Guests: a cookie. */
export async function readCart(): Promise<CartItem[]> {
  const userId = await getUserId();
  if (!userId) return readGuestCart();
  const rows = await db.query.cartItems.findMany({
    where: (c, { eq }) => eq(c.userId, userId),
    orderBy: (c, { asc }) => [asc(c.createdAt)],
    limit: MAX_LINES,
  });
  return clean(rows.map((row) => ({ p: row.productId, c: row.colorId, s: row.size, q: row.quantity })));
}

async function replaceUserCart(userId: string, items: CartItem[]) {
  const del = db.delete(cartItems).where(eq(cartItems.userId, userId));
  if (items.length === 0) {
    await del;
    return;
  }
  const ins = db.insert(cartItems).values(items.map((item) => ({ userId, productId: item.p, colorId: item.c, size: item.s, quantity: item.q })));
  await db.batch([del, ins] as unknown as Parameters<typeof db.batch>[0]);
}

export async function writeCart(items: CartItem[]) {
  const lines = clean(items);
  const userId = await getUserId();
  if (userId) {
    await replaceUserCart(userId, lines);
    (await cookies()).delete(COOKIE);
  } else {
    (await cookies()).set(COOKIE, JSON.stringify(lines), { ...cookieBase(), httpOnly: true });
  }
  await setCount(lines);
}

export async function clearCart() {
  const userId = await getUserId();
  const store = await cookies();
  if (userId) await db.delete(cartItems).where(eq(cartItems.userId, userId));
  store.delete(COOKIE);
  store.delete(COUNT_COOKIE);
}

/** After sign-in: whatever the guest put in the cookie cart is merged into the account cart. */
export async function mergeGuestCart(userId: string) {
  const guest = await readGuestCart();
  const saved = await db.query.cartItems.findMany({ where: (c, { eq }) => eq(c.userId, userId), limit: MAX_LINES });
  const savedItems = saved.map((row) => ({ p: row.productId, c: row.colorId, s: row.size, q: row.quantity }));
  const merged = clean([...savedItems, ...guest]);

  // Products can disappear; drop lines whose product or color no longer exists so the insert cannot fail.
  const colorRows = merged.length
    ? await db.query.productColors.findMany({
        where: (c, { inArray }) => inArray(c.id, merged.map((item) => item.c)),
        columns: { id: true, productId: true },
      })
    : [];
  const ok = new Set(colorRows.map((row) => `${row.productId}:${row.id}`));
  const valid = merged.filter((item) => ok.has(`${item.p}:${item.c}`));

  if (guest.length > 0 || valid.length !== savedItems.length) await replaceUserCart(userId, valid);
  const store = await cookies();
  store.delete(COOKIE);
  await setCount(valid);
}

export async function cartCount() {
  const items = await readCart();
  return items.reduce((sum, item) => sum + item.q, 0);
}

