"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const supabase = useMemo(() => createBrowserSupabase(), [])

  useEffect(() => {
    async function loadAuthState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      setSignedIn(Boolean(user));
    }
    loadAuthState();
  }, []);

  return (
    <section className="max-w-3xl p-8 mx-auto bg-white border shadow-sm rounded-2xl border-slate-200 sm:p-12">
      <p className="inline-flex px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 uppercase rounded-full bg-indigo-50">
        GWL Attendance
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Weekday sign-ins, made simple
      </h1>
      <p className="max-w-2xl mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
        Sign in each school day to keep your attendance streak visible and easy
        to review.
      </p>
      {signedIn === null && (
        <div className="mt-8">
          <Skeleton count={1} width={114} height={40} />
        </div>
      )}
      {signedIn !== null && 
      <div className="flex flex-wrap gap-3 mt-8">
        <Link
          href={signedIn ? "/dashboard/" : "/auth/register/"}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          {signedIn ? "Dashboard" : "Sign up"}
        </Link>
      </div>
}
    </section>
  );
}