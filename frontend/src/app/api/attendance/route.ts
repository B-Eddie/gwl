import { NextResponse, type NextRequest } from "next/server";
import { createRouteSupabase, getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { supabase } = createRouteSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("attendance")
    .select("date")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dates = (data ?? []).map((row) => String(row.date).slice(0, 10));
  return NextResponse.json({ dates });
}
