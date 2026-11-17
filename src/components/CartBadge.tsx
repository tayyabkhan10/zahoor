"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BagIcon } from "./Icons";

function readCount() {
  const match = document.cookie.match(/(?:^|; )zh_n=(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** Cart count read from a small cookie in the browser, so the navbar never forces a server render. */
export default function CartBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setCount(readCount());
    update();
    window.addEventListener("cart:changed", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("cart:changed", update);
      window.removeEventListener("focus", update);
    };
  }, [pathname]);

  return (
    <Link
      href="/cart"
      className="relative flex h-10 w-10 items-center justify-center text-neutral-800 transition-colors hover:text-brand"
      aria-label={`Cart, ${count} items`}
    >
      <BagIcon />
      {count > 0 && (
        <span className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
