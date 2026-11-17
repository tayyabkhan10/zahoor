import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STORE_NAME } from "@/lib/config";
import { INFO_PAGES } from "@/lib/pages";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(INFO_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = INFO_PAGES[slug];
  return { title: page ? `${page.title} | ${STORE_NAME}` : `Not found | ${STORE_NAME}` };
}

export default async function InfoPageView({ params }: Props) {
  const { slug } = await params;
  const page = INFO_PAGES[slug];
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
      <h1 className="text-4xl text-brand sm:text-5xl">{page.title}</h1>
      <div className="mt-10 space-y-8">
        {page.sections.map((section, index) => (
          <section key={index}>
            {section.heading && <h2 className="text-xl text-brand">{section.heading}</h2>}
            <div className="mt-3 space-y-3 text-base leading-relaxed text-muted">
              {section.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Link href="/collections/all" className="mt-12 inline-block border-b border-brand pb-0.5 text-sm font-semibold uppercase tracking-wider text-brand">
        Continue shopping
      </Link>
    </div>
  );
}
