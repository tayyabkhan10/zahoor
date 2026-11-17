import Link from "next/link";
import { STORE_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, FREE_DELIVERY_QTY } from "@/lib/config";
import { GENDERS, TAXONOMY, groupSlug, categorySlug, slugify } from "@/lib/taxonomy";
import AccountLink from "./AccountLink";
import CartBadge from "./CartBadge";
import { ChevronIcon, CloseIcon, MenuIcon, SearchIcon } from "./Icons";

/** Static navigation: built from lib/taxonomy.ts, so it never touches the database and every page stays cached. */
export default function Navbar() {
  const topLinks = [
    ...GENDERS.map((gender) => ({ label: gender, href: `/collections/${slugify(gender)}`, gender })),
    { label: "New Arrivals", href: "/collections/new-arrivals", gender: null },
    { label: "Sale", href: "/collections/sale", gender: null, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="bg-brand px-5 py-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-white sm:text-xs">
        Free delivery on {FREE_DELIVERY_QTY}+ items · Cash on delivery across Pakistan
      </div>

      <div className="hidden border-b border-line bg-sand lg:block">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-1.5 text-xs text-muted">
          <p>
            Customer care: <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="hover:text-brand">{SUPPORT_PHONE}</a>
            <span className="mx-2">|</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-brand">{SUPPORT_EMAIL}</a>
          </p>
          <p className="flex items-center gap-5">
            <Link href="/pages/shipping-and-delivery" className="hover:text-brand">Shipping</Link>
            <Link href="/pages/exchange-and-returns" className="hover:text-brand">Exchange &amp; Returns</Link>
            <Link href="/track" className="hover:text-brand">Track order</Link>
          </p>
        </div>
      </div>

      <div className="border-b border-line">
        <nav className="relative mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-8 lg:h-[72px]">
          {/* Mobile menu */}
          <details className="group lg:hidden">
            <summary
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center text-neutral-900 [&::-webkit-details-marker]:hidden"
              aria-label="Toggle menu"
            >
              <MenuIcon className="h-6 w-6 group-open:hidden" />
              <CloseIcon className="hidden h-6 w-6 group-open:block" />
            </summary>

            <div className="absolute inset-x-0 top-full max-h-[calc(100vh-7rem)] overflow-y-auto border-b border-line bg-white shadow-md">
              <ul className="px-5 py-2">
                {GENDERS.map((gender) => (
                  <li key={gender} className="border-b border-line">
                    <details className="group/item">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold uppercase tracking-wider [&::-webkit-details-marker]:hidden">
                        {gender}
                        <ChevronIcon className="h-4 w-4 transition-transform group-open/item:rotate-180" />
                      </summary>
                      <ul className="pb-3 pl-1">
                        <li>
                          <Link href={`/collections/${slugify(gender)}`} className="block py-2 text-sm font-medium text-brand underline underline-offset-4">
                            Shop all {gender}
                          </Link>
                        </li>
                        {TAXONOMY[gender].map((group) => (
                          <li key={group.label}>
                            <details className="group/sub">
                              <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-sm text-neutral-800 [&::-webkit-details-marker]:hidden">
                                {group.label}
                                <ChevronIcon className="h-3.5 w-3.5 transition-transform group-open/sub:rotate-180" />
                              </summary>
                              <ul className="pb-2 pl-3">
                                <li>
                                  <Link href={`/collections/${groupSlug(gender, group)}`} className="block py-1.5 text-sm text-muted hover:text-brand">
                                    All {group.label}
                                  </Link>
                                </li>
                                {group.items.map((item) => (
                                  <li key={item}>
                                    <Link href={`/collections/${categorySlug(item)}`} className="block py-1.5 text-sm text-muted hover:text-brand">
                                      {item}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
                <li className="border-b border-line">
                  <Link href="/collections/new-arrivals" className="block py-4 text-sm font-semibold uppercase tracking-wider">New Arrivals</Link>
                </li>
                <li className="border-b border-line">
                  <Link href="/collections/sale" className="block py-4 text-sm font-semibold uppercase tracking-wider text-accent">Sale</Link>
                </li>
                <li>
                  <Link href="/track" className="block py-4 text-sm font-medium text-neutral-700">Track order</Link>
                </li>
              </ul>
            </div>
          </details>

          <Link
            href="/"
            className="font-serif text-2xl font-semibold tracking-[0.32em] text-brand lg:text-[1.7rem]"
            aria-label={`${STORE_NAME} home`}
          >
            {STORE_NAME}
          </Link>

          {/* Desktop navigation with mega menu */}
          <ul className="hidden flex-1 items-stretch justify-center gap-9 lg:flex">
            {topLinks.map((link) => (
              <li key={link.label} className="group static flex items-center">
                <Link
                  href={link.href}
                  className={`flex h-[72px] items-center gap-1 border-b-2 border-transparent text-[13px] font-medium uppercase tracking-[0.14em] transition-colors group-hover:border-brand ${
                    "highlight" in link && link.highlight ? "text-accent" : "text-neutral-900"
                  }`}
                >
                  {link.label}
                </Link>

                {link.gender && (
                  <div className="invisible absolute inset-x-0 top-full border-y border-line bg-white opacity-0 shadow-[0_20px_30px_-20px_rgba(0,0,0,0.25)] transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="mx-auto grid max-w-[1500px] grid-cols-5 gap-x-8 gap-y-8 px-8 py-8">
                      {TAXONOMY[link.gender].map((group) => (
                        <div key={group.label}>
                          <Link href={`/collections/${groupSlug(link.gender, group)}`} className="text-[13px] font-semibold uppercase tracking-wider text-brand hover:underline">
                            {group.label}
                          </Link>
                          <ul className="mt-3 space-y-2">
                            {group.items.map((item) => (
                              <li key={item}>
                                <Link href={`/collections/${categorySlug(item)}`} className="text-sm text-muted transition-colors hover:text-brand">
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-line bg-sand">
                      <div className="mx-auto flex max-w-[1500px] items-center gap-8 px-8 py-3 text-sm">
                        <Link href={`/collections/${slugify(link.gender)}`} className="font-semibold text-brand underline underline-offset-4">
                          Shop all {link.gender}
                        </Link>
                        <Link href={`/collections/${slugify(link.gender)}-new`} className="text-muted hover:text-brand">New arrivals</Link>
                        <Link href={`/collections/${slugify(link.gender)}-sale`} className="text-accent hover:underline">Sale</Link>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 sm:gap-2">
            <form action="/search" className="hidden items-center border-b border-neutral-300 focus-within:border-brand xl:flex">
              <input
                name="q"
                type="search"
                placeholder="Search"
                aria-label="Search products"
                className="w-36 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted"
              />
              <button aria-label="Search" className="p-1.5 text-neutral-800 hover:text-brand">
                <SearchIcon className="h-[18px] w-[18px]" />
              </button>
            </form>
            <Link href="/search" aria-label="Search" className="flex h-10 w-10 items-center justify-center text-neutral-800 hover:text-brand xl:hidden">
              <SearchIcon />
            </Link>
            <AccountLink />
            <CartBadge />
          </div>
        </nav>
      </div>
    </header>
  );
}
