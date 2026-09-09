import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { loadSnapshot, seedSnapshot } from "@/lib/data/repository";

/**
 * Single hydration call for the dashboard. Runs on the server so the anon key
 * is the only thing the browser ever sees, and so RLS is applied by Postgres
 * rather than trusted from the client.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return NextResponse.json(seedSnapshot());
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    return NextResponse.json(await loadSnapshot(supabase, user.id));
  } catch {
    return NextResponse.json({ error: "Could not load your data" }, { status: 502 });
  }
}
