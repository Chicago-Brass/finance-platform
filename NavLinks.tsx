"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/income-statement", label: "Income Statement" },
  { href: "/balance-sheet", label: "Balance Sheet" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Reports">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? "nav-link active" : "nav-link"}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
