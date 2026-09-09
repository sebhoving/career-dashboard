import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieList = { name: string; value: string; options?: CookieOptions }[];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Refreshes the auth cookie on every request and gates the dashboard.
 * With no Supabase project configured the app runs open on seed data, which
 * keeps `npm run dev` working before any credentials exist.
 */
export async function middleware(request: NextRequest) {
  if (!url || !anon) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: CookieList) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith("/sign-in") || path.startsWith("/auth");

  if (!user && !isPublic) {
    const target = request.nextUrl.clone();
    target.pathname = "/sign-in";
    target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }

  if (user && path.startsWith("/sign-in")) {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|webp)$).*)"],
};
