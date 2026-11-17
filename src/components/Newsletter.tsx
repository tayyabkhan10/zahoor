"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("busy");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState("error");
        setMessage(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setState("done");
      setMessage("Thank you for subscribing!");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-lg lg:justify-self-end">
      <div className="flex border border-white/30 focus-within:border-white">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/40"
        />
        <button disabled={state === "busy"} className="bg-white px-6 text-xs font-semibold uppercase tracking-[0.14em] text-brand transition-colors hover:bg-neutral-200 disabled:opacity-60">
          {state === "busy" ? "..." : "Subscribe"}
        </button>
      </div>
      {message && (
        <p role="status" className={`mt-2 text-xs ${state === "error" ? "text-red-300" : "text-white/70"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
