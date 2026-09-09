import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the app is wired to a real backend rather than seed data. */
export const hasSupabase = Boolean(url && anon);

export function createClient() {
  if (!hasSupabase) return null;
  return createBrowserClient(url!, anon!);
}
