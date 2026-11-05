import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

// Pages anyone can reach without signing in.
const PUBLIC_PATHS = ["/", "/login", "/auth/callback", "/not-authorized"];

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

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const isReportApi = path.startsWith("/api/reports/");

  // Protected routes require both live session validation and the current allowlist role.
  // Run them together; getSession() alone must never authorize a request.
  const [{ data: { user } }, access] = await Promise.all([
    supabase.auth.getUser(),
    isPublic ? Promise.resolve(null) : supabase.rpc("current_app_role"),
  ]);

  if (!user) {
    if (isPublic) return response;
    if (isReportApi) return NextResponse.json({ error: "Sign in to load reports." }, { status: 401 });
    const login = request.nextUrl.clone();
    login.pathname = "/";
    login.search = "";
    return NextResponse.redirect(login);
  }

  if (isPublic) return response;

  // Signed in with Microsoft/email is not enough: the user must be on the allowlist.
  if (access?.error || !access?.data) {
    if (isReportApi) return NextResponse.json({ error: "You do not have access to reports." }, { status: 403 });
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
