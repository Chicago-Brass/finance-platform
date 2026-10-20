import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/NavLinks";

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
            <span className="brand-mark small" aria-hidden>CB</span>
            <span className="brand-name">Chicago Brass Finance</span>
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
      <div className="toolbar">
        <div className="toolbar-inner">
          <span className="live-badge">Live ledger test</span>
          <span className="toolbar-hint">Read-only view of the Supabase ledger (DUAL ENTRY). Nothing here changes data.</span>
        </div>
      </div>
      <main className="content">{children}</main>
    </div>
  );
}
