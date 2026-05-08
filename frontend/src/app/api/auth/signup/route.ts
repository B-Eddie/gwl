import { type NextRequest, NextResponse } from "next/server";
import { isSchoolEmail, normalizeEmail, schoolDomain } from "@/lib/domain";
import { createRouteSupabase, getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    display_name?: string;
  };
  // get account info from form
  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");
  const displayName = String(body.display_name ?? "").trim();

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password too short." }, { status: 400 });
  }
  if (!isSchoolEmail(email) && email !== (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "")) {
    return NextResponse.json({ error: `Use @${schoolDomain()} email.` }, { status: 400 });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 503 });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (createErr || !created.user) {
    if (/already|registered|exists/i.test(createErr?.message ?? "")) {
      return NextResponse.json({ error: "Account exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Sign up failed." }, { status: 400 });
  }

  const userId = created.user.id;
  const { error: profileErr } = await admin.from("users").insert({
    id: userId,
    email,
    display_name: displayName,
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Sign up failed." }, { status: 500 });
  }

  const { supabase, applyCookies } = createRouteSupabase(request);
  // New users may take a brief moment to become available for password sign-in.
  let signInErr: { message?: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    signInErr = error;
    if (!signInErr) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const json = NextResponse.json({ ok: true }, { status: 201 });
  if (signInErr) {
    return NextResponse.json(
      { error: "Account created, but automatic sign in failed. Please log in." },
      { status: 503 },
    );
  }
  return applyCookies(json);
}
