"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { schoolDomain } from "@/lib/domain";
import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated";
import Link from "next/link";
import { ArrowRight, GraduationCap, Lock, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const checkingAuth = useRedirectIfAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const d = schoolDomain();

  const inputField =
    "block w-full rounded-lg border border-[#E2E2E5] bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-[#003367] focus:ring-1 focus:ring-[#003367]";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
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

  if (checkingAuth) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#EAF4FA] via-[#F5FAFD] to-white px-6 py-12">
      <div className="w-full max-w-md rounded-xl border-2 border-[#C2C6D2] bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEEEF0]">
            <GraduationCap className="h-6 w-6 text-[#003367]" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-ink">Sign up</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Create your @{d} account
          </p>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                strokeWidth={2}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={`you@${d}`}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputField}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                strokeWidth={2}
              />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputField}
              />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Must be at least 8 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Display Name
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                strokeWidth={2}
              />
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputField}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#003367] py-3 text-sm font-semibold text-white transition hover:bg-[#002255] disabled:opacity-60 hover:cursor-pointer"
          >
            {loading ? "Creating account…" : "Create Account"}
            {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
          </button>
        </form>

        <div className="mt-8 border-t border-[#E2E2E5] pt-6 text-center">
          <p className="text-sm text-ink-muted">Already have an account?</p>
          <Link
            href="/auth/login/"
            className="mt-1 inline-block text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
