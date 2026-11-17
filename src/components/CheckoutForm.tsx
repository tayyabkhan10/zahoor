"use client";

import { useActionState } from "react";
import { placeOrder, type CheckoutState } from "@/actions/checkout";
import { paymentLabel } from "@/lib/policy";

const initialState: CheckoutState = { errors: {}, message: "", values: {} };

const inputClass =
  "mt-2 block w-full border border-line bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand";

function Field({
  name,
  label,
  required,
  state,
  type = "text",
  autoComplete,
  inputMode,
}: {
  name: string;
  label: string;
  required?: boolean;
  state: CheckoutState;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "text";
}) {
  const error = state.errors[name];
  return (
    <label className="block text-sm font-medium text-neutral-900">
      {label}
      {required ? <span className="text-accent"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={state.values[name] ?? ""}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        className={inputClass}
      />
      {error && <span className="mt-1.5 block text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}

export default function CheckoutForm({
  methods,
  defaults,
}: {
  methods: string[];
  defaults?: { name: string; phone: string; email: string };
}) {
  const [state, action, pending] = useActionState(placeOrder, defaults ? { ...initialState, values: { ...defaults } } : initialState);

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}

      <Field name="name" label="Full name" required state={state} autoComplete="name" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="phone" label="Phone number" required state={state} type="tel" inputMode="tel" autoComplete="tel" />
        <Field name="whatsapp" label="WhatsApp number" state={state} type="tel" inputMode="tel" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="altPhone" label="Another number" state={state} type="tel" inputMode="tel" />
        <Field name="email" label="Email" state={state} type="email" inputMode="email" autoComplete="email" />
      </div>

      <label className="block text-sm font-medium text-neutral-900">
        Complete address <span className="text-accent">*</span>
        <textarea
          name="address"
          required
          rows={3}
          defaultValue={state.values.address ?? ""}
          autoComplete="street-address"
          className={inputClass}
        />
        {state.errors.address && <span className="mt-1.5 block text-xs font-normal text-red-600">{state.errors.address}</span>}
      </label>

      <Field name="city" label="City" required state={state} autoComplete="address-level2" />

      <label className="block text-sm font-medium text-neutral-900">
        Order notes <span className="font-normal text-muted">(optional)</span>
        <textarea name="notes" rows={2} defaultValue={state.values.notes ?? ""} className={inputClass} />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-900">
          Payment method <span className="text-accent">*</span>
        </legend>
        {methods.length === 0 && (
          <p className="text-sm text-red-700">
            Items in your cart accept different payment methods. Please order them separately.
          </p>
        )}
        {methods.map((method, index) => (
          <label key={method} className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm has-[:checked]:border-brand">
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              required
              defaultChecked={state.values.paymentMethod ? state.values.paymentMethod === method : index === 0}
            />
            {paymentLabel(method)}
          </label>
        ))}
        {state.errors.paymentMethod && <span className="block text-xs text-red-600">{state.errors.paymentMethod}</span>}
      </fieldset>

      <button
        type="submit"
        disabled={pending || methods.length === 0}
        className="w-full bg-brand py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Placing order..." : "Place order"}
      </button>
    </form>
  );
}
