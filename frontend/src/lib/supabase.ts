// supabase config

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export function supabaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!u) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  return u;
}

export function supabaseAnonKey(): string {
  const k =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!k) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY or PUBLISHABLE_KEY missing");
  return k;
}

export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

// supabase session cookies
export function createRouteSupabase(request: NextRequest) {
  let cookieRes = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookieRes = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieRes.cookies.set(name, value, options),
        );
      },
    },
  });
  const applyCookies = (to: NextResponse) => {
    cookieRes.cookies.getAll().forEach(({ name, value }) => to.cookies.set(name, value));
    return to;
  };
  return { supabase, applyCookies };
}

let _admin: SupabaseClient | null = null;

// admin priveliges
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  _admin = createClient(supabaseUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
