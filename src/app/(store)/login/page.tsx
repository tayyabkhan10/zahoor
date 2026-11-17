import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForm";
import { STORE_NAME } from "@/lib/config";
import { getUserId, safeNext } from "@/lib/user-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: `Sign in | ${STORE_NAME}`, robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);
  if (await getUserId()) redirect(next);

  return (
    <div className="mx-auto max-w-md px-5 py-14 sm:px-8 lg:py-20">
      <h1 className="text-4xl text-brand">Sign in</h1>
      <p className="mt-3 text-sm text-muted">Sign in to check out faster, save your cart and track your orders.</p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
