import Link from "next/link";
import { STORE_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, WHATSAPP_NUMBER } from "@/lib/config";
import { GENDERS, slugify } from "@/lib/taxonomy";
import Newsletter from "./Newsletter";

const help = [
  { label: "FAQs", href: "/pages/faqs" },
  { label: "Payment", href: "/pages/payment" },
  { label: "Shipping & Delivery", href: "/pages/shipping-and-delivery" },
  { label: "Exchange & Returns", href: "/pages/exchange-and-returns" },
  { label: "Size Guide", href: "/pages/size-guide" },
  { label: "Track Order", href: "/track" },
];

const about = [
  { label: "About Us", href: "/pages/about-us" },
  { label: "Contact Us", href: "/pages/contact-us" },
  { label: "Terms & Conditions", href: "/pages/terms-and-conditions" },
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
];

function Accept({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">We accept</h3>
      <p className="mt-3 text-sm text-white/60">Cash on delivery · Card · Online</p>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-24 bg-brand text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl uppercase tracking-[0.12em]">Get the latest trends first</h2>
            <p className="mt-2 text-sm text-white/60">New arrivals and offers, straight to your inbox.</p>
          </div>
          <Newsletter />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-x-6 gap-y-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] lg:gap-12">
        {/* 1. ZAHOOR: poori width */}
        <div className="col-span-2 mb-4 lg:col-span-1 lg:mb-0">
          <Link href="/" aria-label={`${STORE_NAME} home`} className="font-serif text-2xl font-semibold tracking-[0.32em]">
            {STORE_NAME}
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
            Real fashion, real prices. Clothing for Women, Men and Kids, delivered across Pakistan.
          </p>
          <ul className="mt-6 space-y-1.5 text-sm text-white/70">
            <li>
              Phone: <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="hover:text-white">{SUPPORT_PHONE}</a>
            </li>
            <li>
              Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all hover:text-white">{SUPPORT_EMAIL}</a>
            </li>
            <li>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-white">
                Chat on WhatsApp
              </a>
            </li>
          </ul>
        </div>

        {/* 2. Shop | Help */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Shop</h3>
          <ul className="mt-5 space-y-3 text-sm text-white/60">
            {GENDERS.map((gender) => (
              <li key={gender}>
                <Link href={`/collections/${slugify(gender)}`} className="transition-colors hover:text-white">{gender}</Link>
              </li>
            ))}
            <li><Link href="/collections/new-arrivals" className="transition-colors hover:text-white">New Arrivals</Link></li>
            <li><Link href="/collections/sale" className="transition-colors hover:text-white">Sale</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Help</h3>
          <ul className="mt-5 space-y-3 text-sm text-white/60">
            {help.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. About | Account */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">About</h3>
          <ul className="mt-5 space-y-3 text-sm text-white/60">
            {about.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Account</h3>
          <ul className="mt-5 space-y-3 text-sm text-white/60">
            <li><Link href="/login" className="transition-colors hover:text-white">Sign in</Link></li>
            <li><Link href="/register" className="transition-colors hover:text-white">Create account</Link></li>
            <li><Link href="/account" className="transition-colors hover:text-white">My orders</Link></li>
            <li><Link href="/cart" className="transition-colors hover:text-white">Your cart</Link></li>
          </ul>
          <Accept className="mt-8 hidden lg:block" />
        </div>

        <Accept className="col-span-2 lg:hidden" />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {STORE_NAME}. All rights reserved.</p>
          <p>All prices in PKR</p>
        </div>
      </div>
    </footer>
  );
}