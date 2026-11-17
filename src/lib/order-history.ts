import "server-only";
import { cookies } from "next/headers";

const COOKIE = "zh_orders";
const MAX = 30;
const pattern = /^ZH-[A-Z0-9]{8}$/;

/** Order numbers placed from this browser (guest checkout). */
export async function readOrderHistory(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  return raw.split(",").filter((value) => pattern.test(value)).slice(0, MAX);
}

export async function rememberOrder(orderNumber: string) {
  const current = await readOrderHistory();
  const next = [orderNumber, ...current.filter((value) => value !== orderNumber)].slice(0, MAX);
  (await cookies()).set(COOKIE, next.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
