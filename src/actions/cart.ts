"use server";

import { redirect } from "next/navigation";
import { readCart, writeCart } from "@/lib/cart";
import { MAX_QTY, SIZE_PATTERN } from "@/lib/config";

const idPattern = /^[0-9a-f-]{36}$/i;

function parse(formData: FormData) {
  const p = String(formData.get("productId") ?? "");
  const c = String(formData.get("colorId") ?? "");
  const s = String(formData.get("size") ?? "").trim();
  const q = Math.floor(Number(formData.get("quantity") ?? 1)) || 1;
  if (!idPattern.test(p) || !idPattern.test(c)) return null;
  if (s !== "" && !SIZE_PATTERN.test(s)) return null;
  return { p, c, s, q: Math.min(Math.max(q, 1), MAX_QTY) };
}

const same = (a: { p: string; c: string; s: string }, b: { p: string; c: string; s: string }) =>
  a.p === b.p && a.c === b.c && a.s === b.s;

// The navbar badge reads a small cookie in the browser and the cart pages are always dynamic,
// so nothing needs to be revalidated here. (Purging "/" on every add-to-cart wiped the cache for ALL visitors.)
function refresh() {}

/** Add to cart: quantity is added on top of what is already in the cart. */
async function add(formData: FormData) {
  const item = parse(formData);
  if (!item) return false;
  const cart = await readCart();
  const existing = cart.find((line) => same(line, item));
  if (existing) existing.q = Math.min(existing.q + item.q, MAX_QTY);
  else cart.push(item);
  await writeCart(cart);
  return true;
}

/** Buy now: the chosen quantity becomes the exact quantity of that item (it is not added again). */
async function setExact(formData: FormData) {
  const item = parse(formData);
  if (!item) return false;
  const cart = await readCart();
  const existing = cart.find((line) => same(line, item));
  if (existing) existing.q = item.q;
  else cart.push(item);
  await writeCart(cart);
  return true;
}

export async function addToCart(formData: FormData) {
  const ok = await add(formData);
  refresh();
  if (ok) redirect("/cart");
}

export async function buyNow(formData: FormData) {
  const ok = await setExact(formData);
  refresh();
  if (ok) redirect("/checkout");
}

export async function updateCartItem(formData: FormData) {
  const item = parse(formData);
  if (!item) return;
  const cart = await readCart();
  await writeCart(cart.map((line) => (same(line, item) ? { ...line, q: item.q } : line)));
  refresh();
}

export async function removeCartItem(formData: FormData) {
  const item = parse(formData);
  if (!item) return;
  const cart = await readCart();
  await writeCart(cart.filter((line) => !same(line, item)));
  refresh();
}
