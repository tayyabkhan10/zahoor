import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForm";
import { STORE_NAME } from "@/lib/config";
import { getUserId, safeNext } from "@/lib/user-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: `Create account | ${STORE_NAME}`, robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);
  if (await getUserId()) redirect(next);

  return (
    <div className="mx-auto max-w-md px-5 py-14 sm:px-8 lg:py-20">
      <h1 className="text-4xl text-brand">Create account</h1>
      <p className="mt-3 text-sm text-muted">Your cart is kept when you sign up, and every order you place is saved to your account.</p>
      <div className="mt-8">
        <RegisterForm next={next} />
      </div>
    </div>
  );
}
