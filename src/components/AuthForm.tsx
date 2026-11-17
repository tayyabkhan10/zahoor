"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginUser, registerUser, type AuthState } from "@/actions/account";

const initial: AuthState = { errors: {}, message: "", values: {} };

const inputClass =
  "mt-2 block w-full border border-line bg-white px-4 py-3.5 text-sm text-neutral-900 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand";

function Field({
  name,
  label,
  state,
  type = "text",
  required = true,
  autoComplete,
  hint,
}: {
  name: string;
  label: string;
  state: AuthState;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  const error = state.errors[name];
  return (
    <label className="block text-sm font-medium text-neutral-900">
      {label}
      {!required && <span className="font-normal text-muted"> (optional)</span>}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={type === "password" ? "" : (state.values[name] ?? "")}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={inputClass}
      />
      {hint && !error && <span className="mt-1.5 block text-xs font-normal text-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginUser, initial);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state.message && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
      <Field name="email" label="Email" type="email" state={state} autoComplete="email" />
      <Field name="password" label="Password" type="password" state={state} autoComplete="current-password" />
      <button
        disabled={pending}
        className="w-full bg-brand py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        New to ZAHOOR?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-medium text-brand underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(registerUser, initial);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state.message && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
      <Field name="name" label="Full name" state={state} autoComplete="name" />
      <Field name="email" label="Email" type="email" state={state} autoComplete="email" />
      <Field name="phone" label="Phone number" type="tel" required={false} state={state} autoComplete="tel" />
      <Field name="password" label="Password" type="password" state={state} autoComplete="new-password" hint="At least 8 characters." />
      <button
        disabled={pending}
        className="w-full bg-brand py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-brand underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
