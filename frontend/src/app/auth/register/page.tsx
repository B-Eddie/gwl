"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { schoolDomain } from "@/lib/domain";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // used to update the react state to be used when creating account on database
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const d = schoolDomain();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed.");
      return;
    }
    router.push("/dashboard/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-ink">Create account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        @{d} email and password (8+ characters).
      </p>
      {error && (
        <p className="px-3 py-2 mt-4 text-sm text-red-800 rounded-lg bg-red-50">
          {error}
        </p>
      )}
      <form
        onSubmit={onSubmit}
        className="p-6 mt-8 space-y-4 border shadow-sm rounded-2xl border-slate-200 bg-surface-card"
      >
        <input
          type="email"
          autoComplete="email"
          placeholder={`you@${d}`}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-3 py-2 border rounded-lg border-slate-300"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full px-3 py-2 border rounded-lg border-slate-300"
        />
        <input
          type="text"
          autoComplete="name"
          placeholder="Display name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="block w-full px-3 py-2 border rounded-lg border-slate-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
