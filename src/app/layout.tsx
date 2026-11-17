import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/config";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-display",
  display: "swap",
});

const body = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${STORE_NAME} | ${STORE_TAGLINE}`,
  description:
    "Online fashion for Men, Women and Kids. Ready to wear, unstitched, western and everyday essentials. Cash on delivery across Pakistan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* Product photos come from Cloudinary: open that connection early so images start loading sooner. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.pexels.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
