import { SearchIcon } from "@/components/Icons";
import CollectionView, { readFilters, type RawParams } from "@/components/CollectionView";
import { getCatalog } from "@/lib/catalog";
import { filterCatalog } from "@/lib/catalog-utils";
import { STORE_NAME } from "@/lib/config";

export const metadata = { title: `Search | ${STORE_NAME}` };

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = await searchParams;
  const q = (Array.isArray(raw.q) ? raw.q[0] : raw.q)?.trim().slice(0, 80) ?? "";
  const { filters, page } = readFilters(raw, { q: q || undefined });

  const all = await getCatalog();
  const matches = q ? filterCatalog(all, { q }) : [];

  return (
    <>
      <div className="mx-auto max-w-[1500px] px-5 pt-10 sm:px-8 lg:pt-14">
        <form action="/search" className="flex max-w-2xl border-b-2 border-brand">
          <input
            name="q"
            defaultValue={q}
            autoFocus={!q}
            type="search"
            placeholder="Search kurta, polo, lawn, perfume..."
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent py-3 text-lg outline-none placeholder:text-muted"
          />
          <button aria-label="Search" className="px-3 text-brand">
            <SearchIcon className="h-6 w-6" />
          </button>
        </form>
      </div>

      {q ? (
        <CollectionView
          title={`Results for "${q}"`}
          crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
          catalog={matches}
          filters={filters}
          page={page}
          basePath="/search"
          raw={raw}
        />
      ) : (
        <p className="mx-auto max-w-[1500px] px-5 py-10 text-muted sm:px-8">Type a product name, category or fabric to start.</p>
      )}
    </>
  );
}
