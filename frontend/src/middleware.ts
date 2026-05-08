import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSchoolEmail, normalizeEmail } from "@/lib/domain";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

export async function middleware(request: NextRequest) {
  // check if user is logged in

  let res = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        res = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email && !isSchoolEmail(normalizeEmail(user.email))) {
    await supabase.auth.signOut();
  }
  return res;
}

// exclude static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};