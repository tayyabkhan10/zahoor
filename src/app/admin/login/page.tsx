import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getAdminId } from "@/lib/auth";
import { STORE_NAME } from "@/lib/config";

export default async function AdminLoginPage() {
  if (await getAdminId()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md border border-line bg-white p-8 sm:p-10">
        <p className="font-serif text-2xl font-semibold tracking-[0.3em] text-brand">{STORE_NAME}</p>
        <h1 className="mt-8 text-3xl text-brand">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted">Only the store admin can manage products and orders.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
