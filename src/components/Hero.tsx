"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowIcon } from "./Icons";

type Slide = {
  kicker: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  bg: string;
  image: string;
  position: string;
};

const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;

const SLIDES: Slide[] = [
  { kicker: "Eastern elegance", title: "Your Daily Dose of Style.", text: "Effortless pieces for every hour of your day.", cta: "Shop Women", href: "/collections/women", bg: "#2a2420", image: pexels(27603274), position: "50% 22%" },
  { kicker: "Mega sale is live", title: "Up to 40% Off. Real Fashion, Real Prices.", text: "Your favourites at prices you will love. While stock lasts.", cta: "Shop the Sale", href: "/collections/sale", bg: "#8f1d17", image: pexels(25185003), position: "50% 30%" },
  { kicker: "Stitch different", title: "Fresh Prints. Soft Fabrics.", text: "Your next favourite outfit is one stitch away.", cta: "Discover Unstitched", href: "/collections/women-unstitched", bg: "#1f3a34", image: pexels(30953661), position: "50% 25%" },
  { kicker: "Signature collection", title: "Embroidered. Elegant. Everyday.", text: "Detailed craftsmanship for the moments that matter.", cta: "Shop Signature Pret", href: "/collections/signature-pret", bg: "#1d2f27", image: pexels(36608749), position: "50% 22%" },
  { kicker: "Tailored for the modern man", title: "Classic Looks. Modern Comfort.", text: "Clean cuts and premium fabric, from home to event.", cta: "Shop Men", href: "/collections/men", bg: "#1b2430", image: pexels(25184936), position: "50% 25%" },
  { kicker: "Just landed", title: "New Arrivals, Every Week.", text: "Be the first to wear what is next.", cta: "See What's New", href: "/collections/new-arrivals", bg: "#2b2b2b", image: pexels(36090382), position: "50% 30%" },
  { kicker: "Summer ready", title: "Colour That Moves With You.", text: "Light fabrics and easy styles for warm days.", cta: "Explore New In", href: "/collections/new-arrivals", bg: "#1f3550", image: pexels(20777180), position: "50% 28%" },
];

/**
 * Hero with swipe only: no auto-play, no side buttons. The customer moves it with a finger swipe
 * (native scroll-snap, no drag code) or by tapping a dot. Only the first photo loads right away.
 */
export default function Hero() {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function onScroll() {
    const el = track.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index) setIndex(next);
  }

  function goTo(i: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <section className="relative isolate bg-neutral-900" aria-roledescription="carousel" aria-label="Featured collections">
      <div
        ref={track}
        onScroll={onScroll}
        className="no-scrollbar flex h-[30rem] snap-x snap-mandatory overflow-x-auto overscroll-x-contain sm:h-[34rem] lg:h-[40rem]"
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden"
            style={{ backgroundColor: slide.bg }}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "auto"}
              quality={60}
              sizes="100vw"
              draggable={false}
              className="object-cover"
              style={{ objectPosition: slide.position }}
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 lg:bg-gradient-to-r lg:from-black/65 lg:via-black/15 lg:to-transparent" />

            <div className="absolute inset-0 mx-auto flex max-w-[1500px] items-end px-6 pb-16 text-white sm:px-10 lg:items-center lg:px-16 lg:pb-0">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/85">{slide.kicker}</p>
                {i === 0 ? (
                  <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-6xl">{slide.title}</h1>
                ) : (
                  <h2 className="mt-3 font-serif text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-6xl">{slide.title}</h2>
                )}
                <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">{slide.text}</p>
                <Link
                  href={slide.href}
                  draggable={false}
                  tabIndex={i === index ? 0 : -1}
                  className="mt-7 inline-flex items-center gap-2 bg-white px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900 transition-colors hover:bg-neutral-200"
                >
                  {slide.cta}
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full shadow transition-all duration-300 ${i === index ? "w-8 bg-white" : "w-2.5 bg-white/55"}`}
          />
        ))}
      </div>
    </section>
  );
}