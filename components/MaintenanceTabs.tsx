import Link from "next/link";
import "./maintenance.css";

export function MaintenanceTabs({ active }: { active: "progress" | "issues" }) {
  return <nav className="maintenance-tabs" aria-label="Maintenance views">
    <Link href="/progress" aria-current={active === "progress" ? "page" : undefined}>Progress</Link>
    <Link href="/progress?tab=issues" aria-current={active === "issues" ? "page" : undefined}>Issues</Link>
  </nav>;
}
