import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

// Pages anyone can reach without signing in.
const PUBLIC_PATHS = ["/login", "/auth/callback", "/not-authorized"];

export async function middleware(request: NextRequest) {
  const { url, key } = supabaseConfig();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the session with Supabase Auth (do not trust getSession() here).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user) {
    if (isPublic) return response;
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  if (isPublic) return response;

  // Signed in with Microsoft/email is not enough: the user must be on the allowlist.
  const { data: role, error } = await supabase.rpc("current_app_role");
  if (error || !role) {
    const denied = request.nextUrl.clone();
    denied.pathname = "/not-authorized";
    denied.search = "";
    return NextResponse.redirect(denied);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
