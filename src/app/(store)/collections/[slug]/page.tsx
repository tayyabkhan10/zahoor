import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionView, { readFilters, type Chip, type RawParams } from "@/components/CollectionView";
import { getCatalog } from "@/lib/catalog";
import { filterCatalog } from "@/lib/catalog-utils";
import { STORE_NAME } from "@/lib/config";
import type { CatalogProduct } from "@/lib/catalog-types";
import { GENDERS, TAXONOMY, getCollection, groupSlug, categorySlug, slugify, type Collection, type Gender } from "@/lib/taxonomy";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawParams>;
};

/** Categories typed in by the admin (not in the menu) still get a working collection page. */
function resolveCollection(slug: string, catalog: CatalogProduct[]): Collection | null {
  const known = getCollection(slug);
  if (known) return known;
  const match = catalog.find((product) => categorySlug(product.category) === slug);
  return match ? { slug, title: match.category, gender: match.gender as Gender, categories: [match.category] } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = resolveCollection(slug, await getCatalog());
  if (!collection) return { title: `Not found | ${STORE_NAME}` };
  return {
    title: `${collection.title} | ${STORE_NAME}`,
    description: `Shop ${collection.title} online at ${STORE_NAME}. Cash on delivery across Pakistan.`,
  };
}

/** Chips shown under the title: sections of a gender, or sibling categories of a group. */
function chipsFor(collection: Collection): Chip[] {
  const { gender, slug } = collection;
  if (!gender) {
    if (slug === "all" || slug === "new-arrivals" || slug === "sale") {
      return GENDERS.map((g) => ({ label: g, href: `/collections/${slugify(g)}` }));
    }
    return [];
  }
  const groups = TAXONOMY[gender as Gender];
  if (slug === slugify(gender) || slug.startsWith(`${slugify(gender)}-new`) || slug.startsWith(`${slugify(gender)}-sale`)) {
    return groups.map((group) => ({ label: group.label, href: `/collections/${groupSlug(gender as Gender, group)}` }));
  }
  const group = groups.find((g) => groupSlug(gender as Gender, g) === slug || g.items.some((item) => categorySlug(item) === slug));
  if (!group) return [];
  return [
    { label: `All ${group.label}`, href: `/collections/${groupSlug(gender as Gender, group)}`, active: groupSlug(gender as Gender, group) === slug },
    ...group.items.map((item) => ({ label: item, href: `/collections/${categorySlug(item)}`, active: categorySlug(item) === slug })),
  ];
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const all = await getCatalog();
  const collection = resolveCollection(slug, all);
  if (!collection) notFound();

  const raw = await searchParams;
  const { filters, page } = readFilters(raw, {
    gender: collection.gender,
    categories: collection.categories,
    sale: collection.sale,
    newIn: collection.newIn,
  });

  // The collection itself (gender / category / sale / new) is applied first, so the size list only shows sizes that exist here.
  const inCollection = filterCatalog(all, {
    gender: collection.gender,
    categories: collection.categories,
    sale: collection.sale,
    newIn: collection.newIn,
  });

  const crumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];
  if (collection.gender && collection.slug !== slugify(collection.gender)) {
    crumbs.push({ label: collection.gender, href: `/collections/${slugify(collection.gender)}` });
  }
  crumbs.push({ label: collection.title });

  return (
    <CollectionView
      title={collection.title}
      crumbs={crumbs}
      chips={chipsFor(collection)}
      catalog={inCollection}
      filters={filters}
      page={page}
      basePath={`/collections/${slug}`}
      raw={raw}
    />
  );
}
