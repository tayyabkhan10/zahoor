"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth";

const initialState: LoginState = { error: "" };

const inputClass =
  "mt-2 block w-full border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <label className="block text-sm font-medium text-neutral-900">
        Email
        <input name="email" type="email" required autoComplete="username" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-neutral-900">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
