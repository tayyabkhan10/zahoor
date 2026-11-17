import type { CatalogProduct, Filters } from "./catalog-types";
import { currentPrice, isOnSale } from "./pricing";

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 45;

export function filterCatalog(products: CatalogProduct[], filters: Filters) {
  const q = filters.q?.trim().toLowerCase();
  const cats = filters.categories?.length ? new Set(filters.categories.map((c) => c.toLowerCase())) : null;
  const gender = filters.gender?.toLowerCase();
  const now = Date.now();

  const list = products.filter((p) => {
    if (gender && p.gender.toLowerCase() !== gender) return false;
    if (cats && !cats.has(p.category.toLowerCase())) return false;
    if (filters.sale && !isOnSale(p)) return false;
    if (filters.newIn && now - p.createdAtMs > NEW_WINDOW_MS && p.badge !== "New Arrival") return false;
    if (filters.inStock && p.stock < 1) return false;
    if (filters.size && !p.sizes.some((s) => s.toLowerCase() === filters.size!.toLowerCase())) return false;
    const price = currentPrice(p) / 100;
    if (filters.minPrice !== undefined && price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
    if (q && !`${p.name} ${p.category} ${p.gender} ${p.collection ?? ""} ${p.fabric ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  if (filters.sort === "price-asc") list.sort((a, b) => currentPrice(a) - currentPrice(b));
  else if (filters.sort === "price-desc") list.sort((a, b) => currentPrice(b) - currentPrice(a));
  else list.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return list;
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"];
const rank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s);
  if (i !== -1) return i;
  const n = Number(s);
  return Number.isFinite(n) ? 100 + n : 999;
};
export function sizesOf(products: CatalogProduct[]) {
  const set = new Set(products.flatMap((p) => p.sizes));
  return [...set].sort((a, b) => rank(a) - rank(b));
}
/** Same category first, then the same gender, then the newest of the rest. */
export function relatedTo(product: { id: string; category: string; gender: string }, catalog: CatalogProduct[], limit = 4) {
  const others = catalog.filter((p) => p.id !== product.id).sort((a, b) => b.createdAtMs - a.createdAtMs);
  const same = others.filter((p) => p.category === product.category);
  const sameGender = others.filter((p) => p.category !== product.category && p.gender === product.gender);
  const rest = others.filter((p) => p.gender !== product.gender);
  return [...same, ...sameGender, ...rest].slice(0, limit);
}
