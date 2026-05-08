"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase";
import Skeleton from "react-loading-skeleton";

function active(href: string, pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  return p === h || p.startsWith(h + "/");
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadAuthState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      // console.log(Boolean(user));
      setIsAuthenticated(Boolean(user));
    }

    void loadAuthState();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    // kick user off this page if user isn't logged in
    if (!isAuthenticated && isAuthenticated !== null) {
      router.push("/");
      router.refresh();
    }
  }, [isAuthenticated, router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col min-h-full font-sans bg-surface text-ink">
      <header className="border-b border-slate-200 bg-surface-card">
        <div className="flex flex-wrap items-center justify-between max-w-5xl gap-3 px-4 py-3 mx-auto sm:px-6">
          <Link href="/" className="font-semibold text-ink">
            GWL
          </Link>
          <nav className="flex items-center gap-3">
            {!isAuthenticated && isAuthenticated !== null && (
              <Link
                href="/auth/login/"
                className={`rounded-md px-2 py-1 text-sm ${active("/auth/login/", pathname) ? "bg-indigo-50 text-brand" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Sign in
              </Link>
            )}
            {isAuthenticated == null && (
              <Skeleton count={1} width={87.75} height={38} />
            )}
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="px-4 py-2 text-sm font-medium border rounded-lg border-slate-300 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl px-4 py-8 mx-auto sm:px-6">
        {children}
      </main>
    </div>
  );
}
