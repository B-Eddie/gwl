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

  const inputField = "block w-full px-4 py-3 text-white transition border outline-none rounded-xl border-white/20 bg-white/10 placeholder:text-white/45 focus:border-white/50 focus:bg-white/15"

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
    <div className="relative min-h-screen overflow-hidden text-white bg-black">
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-md p-8 border shadow-2xl rounded-3xl border-white/15 bg-white/5 backdrop-blur-xl sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Log in
          </h1>
          <p className="mt-2 text-sm text-white/70">Use your @{d} account.</p>

          {error && (
            <p className="px-3 py-2 mt-5 text-sm text-red-100 border rounded-xl border-red-400/30 bg-red-500/15">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <input
              type="email"
              autoComplete="email"
              placeholder={`you@${d}`}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputField}
            />

            <input
              type="password"
              autoComplete="current-password"
              placeholder="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputField}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-black transition bg-white rounded-full hover:bg-gray-200 disabled:opacity-60"
            >
              {loading ? "…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-white/70">
            Need an account?{" "}
            <Link
              href="/auth/register/"
              className="font-semibold text-white hover:text-white/85"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
