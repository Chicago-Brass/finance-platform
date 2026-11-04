import type { ReactNode } from "react";

type IconName = "excel" | "pdf" | "search" | "filter" | "chevronDown" | "chevronRight" | "expand" | "collapse" | "arrowUp" | "arrowDown" | "minus" | "check" | "mail" | "lock" | "eye" | "eyeOff" | "arrowRight";

export function ReportIcon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    excel: <><path d="M14 3H5v18h14V8zM14 3v5h5M8 12l5 6m0-6-5 6M15 12h2m-2 3h2m-2 3h2" /></>,
    pdf: <><path d="M14 3H5v18h14V8zM14 3v5h5M8 13h8M8 16h8M8 19h5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    filter: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronRight: <path d="m9 6 6 6-6 6" />,
    expand: <path d="m6 8 6-5 6 5M6 16l6 5 6-5" />,
    collapse: <path d="m6 3 6 5 6-5M6 21l6-5 6 5" />,
    arrowUp: <path d="M12 20V4m-6 6 6-6 6 6" />,
    arrowDown: <path d="M12 4v16m-6-6 6 6 6-6" />,
    minus: <path d="M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 5.1 12 5c6 0 10 7 10 7a22 22 0 0 1-3.2 3.9M6.1 6.1A23 23 0 0 0 2 12s4 7 10 7c1.6 0 3.1-.5 4.4-1.2M10 10a3 3 0 0 0 4 4" /></>,
    arrowRight: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return <svg className={`report-icon ${className}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
