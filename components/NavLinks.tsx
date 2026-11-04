"use client";

import { ReportLink } from "./ReportNavigation";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/income-statement", label: "Income Statement" },
  { href: "/balance-sheet", label: "Balance Sheet" },
  { href: "/trial-balance", label: "Trial Balance" },
  { href: "/general-ledger", label: "General Ledger" },
  { href: "/t-chart", label: "T-Chart" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Reports">
      {LINKS.map((l) => (
        <ReportLink key={l.href} href={l.href} className={path === l.href ? "nav-link active" : "nav-link"} aria-current={path === l.href ? "page" : undefined}>
          {l.label}
        </ReportLink>
      ))}
    </nav>
  );
}
