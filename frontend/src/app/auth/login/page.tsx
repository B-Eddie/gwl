"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase";
import { isSchoolEmail, schoolDomain } from "@/lib/domain";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const d = schoolDomain();

  // ignore deprecation notice
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // if email is right format
    if (
      !isSchoolEmail(email) &&
      email !== (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "")
    ) {
      setError(`Use @${d} email.`);
      return;
    }
    setLoading(true);
    const { error: err } =
      await createBrowserSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">@{d} account.</p>
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
          autoComplete="current-password"
          placeholder="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full px-3 py-2 border rounded-lg border-slate-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-center text-ink-muted">
        <Link href="/auth/register/" className="text-brand hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
