import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/db";

const COOKIE = "zh_user";
/** Readable (non-httpOnly) first name, so the navbar can say "Hi, Ali" without making every page dynamic. */
const NAME_COOKIE = "zh_u";
const MAX_AGE = 60 * 60 * 24 * 30;
const AUDIENCE = "customer";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

const base = () => ({
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
});

export async function createUserSession(userId: string, name: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, { ...base(), httpOnly: true });
  store.set(NAME_COOKIE, encodeURIComponent(name.trim().split(/\s+/)[0] ?? ""), { ...base(), httpOnly: false });
}

export async function destroyUserSession() {
  const store = await cookies();
  store.delete(COOKIE);
  store.delete(NAME_COOKIE);
}

/** Cheap check (no database): the id inside a valid signed cookie, or null. */
export async function getUserId() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: AUDIENCE });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** The signed-in customer, confirmed against the database. Use on account and checkout pages. */
export async function getCurrentUser() {
  const id = await getUserId();
  if (!id) return null;
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, id) });
  return user ?? null;
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Only allow redirects to pages on this site. */
export function safeNext(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
