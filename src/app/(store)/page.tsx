import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import SaleSpotlight from "@/components/SaleSpotlight";
import HomeSection from "@/components/HomeSection";
import { ArrowIcon, ReturnIcon, ShieldIcon, TruckIcon, CardIcon } from "@/components/Icons";
import { getCatalog } from "@/lib/catalog";
import { filterCatalog } from "@/lib/catalog-utils";
import { FREE_DELIVERY_QTY } from "@/lib/config";
import { GENDERS, TAXONOMY, groupSlug, slugify, type Gender } from "@/lib/taxonomy";

export const revalidate = 3600;

const perks = [
  { icon: ReturnIcon, title: "Easy exchange", text: "Shown on every product" },
  { icon: ShieldIcon, title: "Secure checkout", text: "Your details stay private" },
  { icon: TruckIcon, title: "Ships across Pakistan", text: `Free delivery on ${FREE_DELIVERY_QTY}+ items` },
  { icon: CardIcon, title: "Cash on delivery", text: "Pay when it arrives" },
];

const SECTIONS: { gender: Gender; title: string; subtitle: string }[] = [
  { gender: "Women", title: "Women", subtitle: "Designs you won't find anywhere else" },
  { gender: "Men", title: "Men", subtitle: "Colour-fast fabrics, clean fits" },
  { gender: "Kids", title: "Kids", subtitle: "Soft, easy and ready to play" },
];

const TILES: { gender: Gender; bg: string; fallback?: string }[] = [
  { gender: "Women", bg: "#3a2a26", fallback: "https://images.pexels.com/photos/29460548/pexels-photo-29460548.jpeg" },
  { gender: "Men", bg: "#1b2430", fallback: "https://images.pexels.com/photos/17542178/pexels-photo-17542178.jpeg" },
  { gender: "Kids", bg: "#b9806c" ,fallback: "https://images.pexels.com/photos/7330334/pexels-photo-7330334.jpeg" },
];

export default async function Home() {
  const all = await getCatalog();
  const fresh = filterCatalog(all, { newIn: true });
  const onSale = filterCatalog(all, { sale: true });

  const counts = new Map<string, { category: string; gender: string; count: number }>();
  for (const product of all) {
    const key = `${product.gender}:${product.category}`;
    const entry = counts.get(key) ?? { category: product.category, gender: product.gender, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-[1500px] px-5 pt-10 sm:px-8 lg:pt-16" aria-label="Shop by section">
        <ul className="grid grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {TILES.map((tile) => {
            const image = all.find((product) => product.gender === tile.gender)?.colors[0]?.images[0]?.url ?? tile.fallback;
            return (
              <li key={tile.gender}>
                <Link href={`/collections/${slugify(tile.gender)}`} className="group relative block aspect-[3/4] overflow-hidden" style={{ backgroundColor: tile.bg }}>
                  {image && (
                    <Image
                      src={image}
                      alt=""
                      fill
                      quality={70}
                      sizes="(min-width: 1500px) 480px, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ objectPosition: "50% 25%" }}
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-6">
                    <span className="block font-serif text-xl sm:text-4xl">{tile.gender}</span>
                    <span className="mt-1 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] sm:flex">
                      Shop now
                      <ArrowIcon />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <SaleSpotlight products={onSale} />

      {top.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-5 pt-16 sm:px-8 lg:pt-24">
          <h2 className="text-4xl text-brand sm:text-5xl">Top collections</h2>
          <p className="mt-2 text-muted">What everyone is shopping right now</p>
          <ol className="mt-8 grid grid-cols-1 gap-x-10 border-t border-line sm:grid-cols-2 lg:grid-cols-5">
            {top.map((item, index) => (
              <li key={`${item.gender}-${item.category}`} className="border-b border-line">
                <Link href={`/collections/${slugify(item.category)}`} className="group flex items-center gap-4 py-5">
                  <span className="font-serif text-3xl text-neutral-300 transition-colors group-hover:text-brand">{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">{item.category}</span>
                    <span className="block text-xs text-muted">{item.gender}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <HomeSection
        title="New Arrivals"
        subtitle="Fresh in this week"
        links={GENDERS.map((gender) => ({ label: gender, href: `/collections/${slugify(gender)}-new` }))}
        products={fresh.slice(0, 4)}
        href="/collections/new-arrivals"
        total={fresh.length}
      />

      {SECTIONS.map((section) => {
        const items = all.filter((product) => product.gender === section.gender);
        const groups = TAXONOMY[section.gender];
        return (
          <div key={section.gender}>
            <HomeSection
              title={section.title}
              subtitle={section.subtitle}
              links={groups.slice(0, 5).map((group) => ({ label: group.label, href: `/collections/${groupSlug(section.gender, group)}` }))}
              products={items.slice(0, 4)}
              href={`/collections/${slugify(section.gender)}`}
              total={items.length}
            />
          </div>
        );
      })}

      {all.length === 0 && (
        <section className="mx-auto max-w-2xl px-5 py-24 text-center">
          <h2 className="text-3xl text-brand">New collection coming soon</h2>
          <p className="mt-3 text-muted">Products will appear here as soon as they are added from the admin panel.</p>
        </section>
      )}

      <section className="mt-16 border-y border-line bg-sand lg:mt-24">
        <ul className="mx-auto grid max-w-[1500px] grid-cols-2 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col items-center gap-2 px-2 text-center">
              <Icon className="h-7 w-7 text-brand" />
              <span className="text-sm font-semibold uppercase tracking-wider text-neutral-900">{title}</span>
              <span className="text-xs text-muted">{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
