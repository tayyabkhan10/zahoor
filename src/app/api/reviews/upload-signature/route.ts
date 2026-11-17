import { NextResponse } from "next/server";
import { REVIEW_FOLDER } from "@/lib/config";
import { signUpload } from "@/lib/cloudinary";
import { getUserId } from "@/lib/user-auth";

/** Signed-in customers can upload review photos straight to Cloudinary (folder zahoor/reviews). */
export async function POST() {
  if (!(await getUserId())) return NextResponse.json({ error: "Please sign in to add photos." }, { status: 401 });
  return NextResponse.json(signUpload(REVIEW_FOLDER));
}
