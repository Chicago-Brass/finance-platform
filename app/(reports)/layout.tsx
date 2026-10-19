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
            <span className="user-email">{user?.email}</span>
            <form action="/auth/signout" method="post">
              <button className="btn btn-quiet" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="toolbar">
        <div className="toolbar-inner">
          <label htmlFor="period" className="toolbar-label">Period</label>
          <select id="period" defaultValue="2026-09" disabled title="Period selection arrives with live ledger data">
            <option value="2026-09">September 2026</option>
          </select>
          <span className="toolbar-hint">More periods arrive when the app is connected to the ledger.</span>
        </div>
      </div>
      <main className="content">{children}</main>
    </div>
  );
}
