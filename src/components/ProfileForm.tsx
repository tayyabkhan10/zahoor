"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/actions/account";

const initial: ProfileState = { ok: false, message: "" };
const inputClass = "mt-2 block w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium">
        Full name
        <input name="name" required defaultValue={name} className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        Phone number
        <input name="phone" type="tel" defaultValue={phone} className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input value={email} disabled className={`${inputClass} bg-sand text-muted`} />
      </label>
      {state.message && (
        <p role="status" className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
      <button
        disabled={pending}
        className="bg-brand px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
