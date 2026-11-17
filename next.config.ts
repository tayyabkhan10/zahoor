import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudinary photos are resized by Cloudinary itself, straight to the browser (see src/lib/image-loader.ts).
    loaderFile: "./src/lib/image-loader.ts",
    // Fewer sizes = fewer variants for the CDN to build and cache.
    deviceSizes: [480, 768, 1080, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
