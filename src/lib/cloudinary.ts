import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { UPLOAD_FOLDER } from "./config";

cloudinary.config({
  cloud_name: process.env.Claudinary_CLOUD_NAME,
  api_key: process.env.Claudinary_API_KEY,
  api_secret: process.env.Claudinary_API_SECRET,
  secure: true,
});

export function signUpload(folder: string = UPLOAD_FOLDER) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.Claudinary_API_SECRET as string,
  );
  return {
    timestamp,
    signature,
    folder,
    apiKey: process.env.Claudinary_API_KEY,
    cloudName: process.env.Claudinary_CLOUD_NAME,
  };
}

export async function deleteImages(publicIds: string[]) {
  const ids = publicIds.filter((id) => id.startsWith("zahoor/"));
  if (ids.length === 0) return;
  try {
    await cloudinary.api.delete_resources(ids, { resource_type: "image" });
  } catch (error) {
    console.error("Cloudinary delete failed", error);
  }
}
