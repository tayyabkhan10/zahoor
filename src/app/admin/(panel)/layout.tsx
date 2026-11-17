import Link from "next/link";
import { logout } from "@/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { STORE_NAME } from "@/lib/config";

const links = [
  { label: "Orders", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Add product", href: "/admin/products/new" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin" aria-label="Admin home">
              <span className="font-serif text-lg font-semibold tracking-[0.3em] text-brand">{STORE_NAME}</span>
            </Link>
            <nav className="flex items-center gap-6">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-neutral-700 hover:text-brand">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/" target="_blank" className="text-sm text-muted hover:text-brand">
              View store
            </Link>
            <form action={logout}>
              <button className="text-sm font-medium text-neutral-700 hover:text-brand">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">{children}</div>
    </>
  );
}
