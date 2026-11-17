import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";

export async function POST() {
  if (!(await getAdminId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(signUpload());
}
