import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "zh_admin";
const MAX_AGE = 60 * 60 * 24 * 7;
/** Admin and customer tokens use the same secret, so each is bound to its own audience. A customer token can never open the admin panel. */
const AUDIENCE = "admin";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function createSession(adminId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getAdminId() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: AUDIENCE });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const id = await getAdminId();
  if (!id) redirect("/admin/login");
  return id;
}
