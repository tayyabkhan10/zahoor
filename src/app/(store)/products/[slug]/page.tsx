import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import ProductView, { ProductViewFromUrl } from "@/components/ProductView";
import ReviewsSection from "@/components/ReviewsSection";
import { getCatalog, getProductDetail } from "@/lib/catalog";
import { relatedTo } from "@/lib/catalog-utils";
import { STORE_NAME } from "@/lib/config";
import { getProductReviews } from "@/lib/reviews";
import { returnLabel } from "@/lib/policy";
import { categorySlug, slugify } from "@/lib/taxonomy";

// Built on first visit, then served from cache. Refreshed when the admin edits a product or stock changes.
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

// The newest products are built ahead of time, so they open instantly. Others are built on first visit.
export async function generateStaticParams() {
  try {
    return (await getCatalog()).slice(0, 40).map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) return { title: `Product not found | ${STORE_NAME}` };
  return {
    title: `${product.name.slice(0, 70)} | ${STORE_NAME}`,
    description: product.description.slice(0, 155) || `${product.name} - ${product.category} for ${product.gender}`,
    openGraph: { images: product.colors[0]?.images[0]?.url ? [product.colors[0].images[0].url] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product || product.colors.length === 0) notFound();

  // Catalog (for "You may also like") and reviews are cached and fetched together.
  const [catalog, { reviews, summary }] = await Promise.all([getCatalog(), getProductReviews(product.id)]);
  const related = relatedTo(product, catalog, 4);
  const rating = { avg: summary.avg, count: summary.count };

  const details = [
    ["Fabric", product.fabric],
    ["Fit", product.fit],
    ["Pieces", product.pieces],
    ["Category", product.category],
    ["Collection", product.collection],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const sections: { title: string; open?: boolean; body: React.ReactNode }[] = [
    {
      title: "Description",
      open: true,
      body: <p className="whitespace-pre-line leading-relaxed">{product.description || `${product.name}. ${product.category} for ${product.gender}.`}</p>,
    },
    {
      title: "Fabric & care",
      body: (
        <div className="space-y-4">
          {details.length > 0 && (
            <dl className="divide-y divide-line border-y border-line">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-2.5">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-neutral-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <p>{product.care || "Wash with similar colours at a gentle temperature. Do not bleach. Iron on low heat."}</p>
        </div>
      ),
    },
    {
      title: "Delivery & exchange",
      body: (
        <div className="space-y-2">
          <p>Delivery across Pakistan, usually in 3 to 5 working days. Free delivery on 3 or more items.</p>
          <p>{returnLabel(product.returnDays)}.</p>
          <p>
            <Link href="/pages/exchange-and-returns" className="underline underline-offset-4">
              Read the full policy
            </Link>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-12">
      <nav className="mb-6 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/collections/${slugify(product.gender)}`} className="hover:text-brand">{product.gender}</Link>
        <span className="mx-2">/</span>
        <Link href={`/collections/${categorySlug(product.category)}`} className="hover:text-brand">{product.category}</Link>
        <span className="mx-2">/</span>
        <span className="inline-block max-w-[16rem] truncate align-bottom text-neutral-900 sm:max-w-md" title={product.name}>{product.name}</span>
      </nav>

      <Suspense fallback={<ProductView product={product} rating={rating} />}>
        <ProductViewFromUrl product={product} rating={rating} />
      </Suspense>

      <section className="mx-auto mt-14 max-w-3xl divide-y divide-line border-y border-line">
        {sections.map((section) => (
          <details key={section.title} open={section.open} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-semibold uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
              {section.title}
              <span className="text-xl font-normal leading-none group-open:hidden">+</span>
              <span className="hidden text-xl font-normal leading-none group-open:inline">−</span>
            </summary>
            <div className="pb-6 text-sm text-muted">{section.body}</div>
          </details>
        ))}
      </section>

      <ReviewsSection productId={product.id} productSlug={product.slug} productName={product.name} reviews={reviews} summary={summary} />

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-12 lg:mt-24 lg:pt-16">
          <h2 className="text-3xl text-brand sm:text-4xl">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
