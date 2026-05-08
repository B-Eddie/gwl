import { NextResponse, type NextRequest } from "next/server";
import { createRouteSupabase, getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // get user data
  const { supabase } = createRouteSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user?.email ||
    user.email !== (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }

  // get attendance info
  const { data, error } = await admin
    .from("attendance")
    .select("id,user_id,attempted_email,date,created_at")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attendance: data ?? [] });
}
