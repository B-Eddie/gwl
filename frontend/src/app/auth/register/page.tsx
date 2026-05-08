"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { schoolDomain } from "@/lib/domain";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // used to update the react state to be used when creating account on database
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const d = schoolDomain();

  const inputField =
    "block w-full px-4 py-3 text-white transition border outline-none rounded-xl border-white/20 bg-white/10 placeholder:text-white/45 focus:border-white/50 focus:bg-white/15";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  return (
    <div className="relative min-h-screen overflow-hidden text-white bg-black">
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-md p-8 border shadow-2xl rounded-3xl border-white/15 bg-white/5 backdrop-blur-xl sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Create account
          </h1>
          <p className="mt-1 text-sm text-white/70">
            @{d} email and password (8+ characters).
          </p>

          {error && (
            <p className="px-3 text-sm text-red-800 rounded-lg bg-red-50">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="p-6 px-0 space-y-4">
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
              autoComplete="new-password"
              placeholder="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputField}
            />
            <input
              type="text"
              autoComplete="name"
              placeholder="display name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputField}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-black transition bg-white rounded-full hover:bg-gray-200 disabled:opacity-60"
            >
              {loading ? "…" : "Create account"}
            </button>

            <p className="mt-6 text-sm text-center text-white/70">
              Already have an account?{" "}
              <Link
                href="/auth/login/"
                className="font-semibold text-white hover:text-white/85"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
