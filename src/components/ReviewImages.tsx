"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
const Lightbox = dynamic(() => import("./Lightbox"), { ssr: false });

/** Photos a customer attached to a review. Click one to open the full-screen viewer. */
export default function ReviewImages({ images, alt }: { images: { id: string; url: string }[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <ul className="mt-3 flex flex-wrap gap-2">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`View photo ${index + 1} in full screen`}
              className="relative block h-20 w-20 cursor-zoom-in overflow-hidden bg-sand ring-1 ring-line transition hover:ring-brand"
            >
              <Image src={image.url} alt={alt} fill sizes="80px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <Lightbox images={images.map((image) => ({ url: image.url, alt }))} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
