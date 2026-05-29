"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase";

export function useRedirectIfAuthenticated(): boolean {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace("/dashboard/");
        return;
      }
      setChecking(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace("/dashboard/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  return checking;
}
