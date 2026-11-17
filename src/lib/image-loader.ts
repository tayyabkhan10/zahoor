import type { ImageLoaderProps } from "next/image";


export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (src.startsWith("https://res.cloudinary.com/") && /\/image\/upload\/v\d+\//.test(src)) {
    return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  if (src.startsWith("https://images.pexels.com/")) {
    return `${src.split("?")[0]}?auto=compress&cs=tinysrgb&w=${width}`;
  }
  if (src.startsWith("/") && !src.startsWith("/api/") && !src.endsWith(".svg")) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
  }
  return src;
}
