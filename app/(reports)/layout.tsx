import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/NavLinks";
import { LOGO_DATA_URI, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/reports/logo";

export const dynamic = "force-dynamic";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo" src={LOGO_DATA_URI} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="Chicago Brass" />
            <span className="brand-name">Finance</span>
          </div>
          <NavLinks />
          <div className="user-box">
            <a className="user-email" href="/account" title="Change password">{user?.email} · Change password</a>
            <form action="/auth/signout" method="post">
              <button className="btn btn-quiet" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
