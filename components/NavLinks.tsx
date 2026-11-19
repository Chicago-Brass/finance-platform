"use client";

import { ReportLink, useReportPath } from "./ReportNavigation";

const LINKS = [
  { href: "/income-statement", label: "Income Statement" },
  { href: "/balance-sheet", label: "Balance Sheet" },
  { href: "/trial-balance", label: "Trial Balance" },
  { href: "/general-ledger", label: "General Ledger" },
  { href: "/periods", label: "Periods" },
  { href: "/progress", label: "Progress" },
];

export function NavLinks({ maintenance = false }: { maintenance?: boolean } = {}) {
  const path = useReportPath();
  return (
    <nav className="nav" aria-label="Reports">
      {LINKS.map((l) => (
        <ReportLink key={l.href} href={l.href} className={path === l.href ? "nav-link active" : "nav-link"} aria-current={path === l.href ? "page" : undefined}>
          <span className="nav-link-width" aria-hidden="true">{maintenance && l.href === "/progress" ? "Maintenance" : l.label}</span>
          <span>{maintenance && l.href === "/progress" ? "Maintenance" : l.label}</span>
        </ReportLink>
      ))}
    </nav>
  );
}
