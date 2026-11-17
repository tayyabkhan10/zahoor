"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type LightboxImage = { url: string; alt?: string };

/** Full-screen image viewer: arrows / swipe / keyboard to move, click or tap the photo to zoom, Esc to close. */
export default function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: LightboxImage[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const current = images[Math.min(index, count - 1)];

  const go = useCallback(
    (step: number) => {
      setZoom(null);
      onIndex((index + step + count) % count);
    },
    [count, index, onIndex],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight" && count > 1) go(1);
      else if (event.key === "ArrowLeft" && count > 1) go(-1);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [count, go, onClose]);

  if (!current) return null;

  function point(event: React.MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 };
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
      onTouchStart={(event) => (touchX.current = event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        const start = touchX.current;
        touchX.current = null;
        if (start === null || zoom || count < 2) return;
        const dx = (event.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-white/70">
          {Math.min(index, count - 1) + 1} / {count}
        </span>
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => setZoom(zoom ? null : { x: 50, y: 50 })} className="text-white/80 hover:text-white">
            {zoom ? "Zoom out" : "Zoom in"}
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center text-2xl leading-none hover:text-white/70">
            ×
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 overflow-hidden ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={(event) => setZoom(zoom ? null : point(event))}
          onMouseMove={(event) => zoom && setZoom(point(event))}
        >
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{ transform: zoom ? "scale(2.4)" : "scale(1)", transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%" }}
          >
            <Image key={current.url} src={current.url} alt={current.alt ?? ""} fill priority sizes="(min-width: 1024px) 130vw, 220vw" className="object-contain" />
          </div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-black/50 text-3xl leading-none hover:bg-black/80 sm:left-5"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-black/50 text-3xl leading-none hover:bg-black/80 sm:right-5"
            >
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 py-3">
          {images.map((image, i) => (
            <li key={`${image.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setZoom(null);
                  onIndex(i);
                }}
                aria-label={`Image ${i + 1}`}
                className={`relative block h-16 w-12 overflow-hidden ${i === index ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
              >
                <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
