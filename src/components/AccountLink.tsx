"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserIcon } from "./Icons";

function readName() {
  const match = document.cookie.match(/(?:^|; )zh_u=([^;]*)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]) || null;
  } catch {
    return null;
  }
}

/** Sign-in state is read from a small cookie in the browser, so the navbar never forces a server render. */
export default function AccountLink() {
  const [name, setName] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setName(readName());
  }, [pathname]);

  return (
    <Link
      href={name ? "/account" : "/login"}
      className="flex h-10 items-center gap-2 px-2 text-neutral-800 transition-colors hover:text-brand"
      aria-label={name ? `Account of ${name}` : "Sign in"}
    >
      <UserIcon />
      <span className="hidden max-w-[7rem] truncate text-sm font-medium lg:inline">{name ? `Hi, ${name}` : "Sign in"}</span>
    </Link>
  );
}
