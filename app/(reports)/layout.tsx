import { reportUser } from "@/lib/reports/report-session";
import { NavLinks } from "@/components/NavLinks";
import { RefreshDataButton, ReportContent, ReportNavigationProvider } from "@/components/ReportNavigation";
import { LOGO_DATA_URI, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/reports/logo";
import { ReportDataProvider } from "@/components/ReportData";
import { ReportApplication } from "@/components/ReportApplication";

export const dynamic = "force-dynamic";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  // Shares the page's Auth check. A failure here is left for the page's error boundary to report.
  const user = await reportUser().catch(() => null);
  const initials = user?.email?.split("@")[0].split(/[._-]/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "CB";

  return (
    <ReportDataProvider key={user?.id} userId={user?.id}><ReportNavigationProvider><div className="app-shell reports-shell">
      <a className="report-skip-link" href="#report-content">Skip to report</a>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo" src={LOGO_DATA_URI} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="Chicago Brass" />
          </div>
          <NavLinks />
          <RefreshDataButton />
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
      <ReportContent><ReportApplication>{children}</ReportApplication></ReportContent>
    </div></ReportNavigationProvider></ReportDataProvider>
  );
}
