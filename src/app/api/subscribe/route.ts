import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { subscribers } from "@/db/schema";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(120) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  await db.insert(subscribers).values({ email: parsed.data.email }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
