"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { mergeGuestCart } from "@/lib/cart";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUserSession, destroyUserSession, getUserId, safeNext } from "@/lib/user-auth";
import { issuesToMap, loginSchema, registerSchema } from "@/lib/validators";

export type AuthState = { errors: Record<string, string>; message: string; values: Record<string, string> };

// Same work whether or not the email exists, so response time does not reveal which emails are registered.
const DUMMY_HASH = "00000000000000000000000000000000:" + "0".repeat(128);

export async function registerUser(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    password: "",
  };
  const next = safeNext(String(formData.get("next") ?? ""), "/account");

  const parsed = registerSchema.safeParse({ ...values, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { errors: issuesToMap(parsed.error.issues), message: "", values };

  const data = parsed.data;
  const existing = await db.query.users.findFirst({ where: eq(users.email, data.email), columns: { id: true } });
  if (existing) {
    return { errors: { email: "An account with this email already exists. Please sign in." }, message: "", values };
  }

  const [created] = await db
    .insert(users)
    .values({ name: data.name, email: data.email, phone: data.phone || null, passwordHash: await hashPassword(data.password) })
    .onConflictDoNothing()
    .returning({ id: users.id });

  if (!created) {
    return { errors: { email: "An account with this email already exists. Please sign in." }, message: "", values };
  }

  await createUserSession(created.id, data.name);
  await mergeGuestCart(created.id);
  redirect(next);
}

export async function loginUser(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const values = { name: "", email: String(formData.get("email") ?? "").trim(), phone: "", password: "" };
  const next = safeNext(String(formData.get("next") ?? ""), "/account");

  const parsed = loginSchema.safeParse({ email: values.email, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { errors: issuesToMap(parsed.error.issues), message: "", values };

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { errors: {}, message: "Incorrect email or password.", values };

  await createUserSession(user.id, user.name);
  await mergeGuestCart(user.id);
  redirect(next);
}

export async function logoutUser() {
  await destroyUserSession();
  // The saved cart stays in the account; the browser starts with an empty guest cart.
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.delete("zh_cart");
  store.delete("zh_n");
  redirect("/");
}

export type ProfileState = { ok: boolean; message: string };

export async function updateProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const id = await getUserId();
  if (!id) redirect("/login?next=/account");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { ok: false, message: "Enter your full name." };
  if (phone && !/^\+?[0-9][0-9\s-]{6,18}$/.test(phone)) return { ok: false, message: "Enter a valid phone number." };

  await db.update(users).set({ name, phone: phone || null }).where(eq(users.id, id));
  await createUserSession(id, name);
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}
