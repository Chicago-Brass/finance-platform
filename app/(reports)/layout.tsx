import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/NavLinks";
import { ReportContent, ReportNavigationProvider } from "@/components/ReportNavigation";
import { LOGO_DATA_URI, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/reports/logo";

export const dynamic = "force-dynamic";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initials = user?.email?.split("@")[0].split(/[._-]/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "CB";

  return (
    <ReportNavigationProvider><div className="app-shell reports-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo" src={LOGO_DATA_URI} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="Chicago Brass" />
            <span className="brand-name">Finance</span>
          </div>
          <NavLinks />
          <details className="account-menu">
            <summary className="account-trigger" aria-label="Account menu"><span className="account-avatar" aria-hidden="true">{initials}</span><span aria-hidden="true">▾</span></summary>
            <div className="account-menu-panel">
              <p className="account-email">{user?.email}</p>
              <a href="/account">Change password</a>
              <form action="/auth/signout" method="post"><button type="submit">Sign out</button></form>
            </div>
          </details>
        </div>
      </header>
      <ReportContent>{children}</ReportContent>
    </div></ReportNavigationProvider>
  );
}
