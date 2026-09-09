import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieList = { name: string; value: string; options?: CookieOptions }[];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseServer = Boolean(url && anon);

/**
 * Server side client bound to the request cookies. Returns null when the
 * project is unconfigured so callers can fall back to seed data instead of
 * throwing during a static build.
 */
export async function createServerSupabase() {
  if (!hasSupabaseServer) return null;
  const store = await cookies();

  return createServerClient(url!, anon!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: CookieList) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component. The middleware refreshes the
          // session instead, so this is safe to ignore.
        }
      },
    },
  });
}
