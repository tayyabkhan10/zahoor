import Link from "next/link";
import { logoutUser } from "@/actions/account";
import OrderCard from "@/components/OrderCard";
import ProfileForm from "@/components/ProfileForm";
import { STORE_NAME } from "@/lib/config";
import { listOrdersForUser } from "@/lib/products";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: `My account | ${STORE_NAME}`, robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const orders = await listOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-brand sm:text-5xl">My account</h1>
          <p className="mt-2 text-muted">Welcome back, {user.name.split(" ")[0]}.</p>
        </div>
        <form action={logoutUser}>
          <button className="border border-brand px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand hover:bg-brand hover:text-white">
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="text-2xl text-brand">Orders</h2>
          {orders.length === 0 ? (
            <div className="mt-5 border border-line bg-sand px-6 py-12 text-center">
              <p className="text-muted">You have not placed any orders yet.</p>
              <Link href="/collections/all" className="mt-5 inline-block border-b border-brand pb-0.5 text-sm font-semibold uppercase tracking-wider text-brand">
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>

        <aside>
          <h2 className="text-2xl text-brand">Profile</h2>
          <div className="mt-5">
            <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
          </div>
        </aside>
      </div>
    </div>
  );
}
