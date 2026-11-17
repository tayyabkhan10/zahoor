"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export type LoginState = { error: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const admin = await db.query.admins.findFirst({ where: eq(admins.email, email) });
  const valid = admin ? await verifyPassword(password, admin.passwordHash) : false;

  if (!admin || !valid) return { error: "Incorrect email or password." };

  await createSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
