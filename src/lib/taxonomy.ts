/**
 * Store structure: Men / Women / Kids -> groups -> categories.
 * The navbar, footer, admin form and collection pages all read this file (no database call),
 * so navigation is instant and the pages stay fully cached.
 */
export const GENDERS = ["Women", "Men", "Kids"] as const;
export type Gender = (typeof GENDERS)[number];

export type Group = { label: string; items: string[] };

export const TAXONOMY: Record<Gender, Group[]> = {
  Women: [
    { label: "Ready To Wear", items: ["Essential Pret", "Signature Pret"] },
    { label: "Unstitched", items: ["Essential Unstitched", "Signature Unstitched"] },
    { label: "Shirts & Trousers", items: ["Women Shirts", "Women Trousers"] },
  ],
  Men: [
    { label: "Eastern Wear", items: ["Shalwar Kameez", "Kurta"] },
    { label: "Unstitched", items: ["Men Cotton", "Wash & Wear"] },
    { label: "Shirts & Pants", items: ["Men Shirts", "Men Pants"] },
  ],
  Kids: [
    { label: "Boys", items: ["Boys T-Shirts & Polos", "Boys Pants"] },
    { label: "Girls", items: ["Girls Pret", "Girls Frocks"] },
  ],
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type Collection = {
  slug: string;
  title: string;
  gender?: Gender;
  /** One category, or every category of a group. */
  categories?: string[];
  sale?: boolean;
  newIn?: boolean;
};

const COLLECTIONS = new Map<string, Collection>();

function add(collection: Collection) {
  COLLECTIONS.set(collection.slug, collection);
}

add({ slug: "all", title: "All Products" });
add({ slug: "new-arrivals", title: "New Arrivals", newIn: true });
add({ slug: "sale", title: "Sale", sale: true });

for (const gender of GENDERS) {
  add({ slug: slugify(gender), title: gender, gender });
  add({ slug: `${slugify(gender)}-new`, title: `${gender} New Arrivals`, gender, newIn: true });
  add({ slug: `${slugify(gender)}-sale`, title: `${gender} Sale`, gender, sale: true });
  for (const group of TAXONOMY[gender]) {
    add({ slug: `${slugify(gender)}-${slugify(group.label)}`, title: `${gender} ${group.label}`, gender, categories: group.items });
    for (const item of group.items) {
      add({ slug: slugify(item), title: item, gender, categories: [item] });
    }
  }
}

export function getCollection(slug: string) {
  return COLLECTIONS.get(slug) ?? null;
}

export function groupSlug(gender: Gender, group: Group) {
  return `${slugify(gender)}-${slugify(group.label)}`;
}

export function categorySlug(category: string) {
  return slugify(category);
}

/** Every valid [gender, category] pair, used to validate admin input. */
export function categoriesFor(gender: string): string[] {
  const groups = TAXONOMY[gender as Gender];
  return groups ? groups.flatMap((g) => g.items) : [];
}

/**
 * Admin can pick a category from the list or type their own.
 * A typed name that matches a listed category (ignoring case / extra spaces) is mapped to the listed spelling.
 */
export function canonicalCategory(gender: string, category: string) {
  const clean = category.replace(/\s+/g, " ").trim();
  const match = categoriesFor(gender).find((item) => item.toLowerCase() === clean.toLowerCase());
  return match ?? clean;
}
