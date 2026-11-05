import "./ledger-tables.css";

export function AccountPill({ code, name }: { code: string | null; name: string | null }) {
  if (!code && !name) return <span className="account-pill-missing">-</span>;
  return <span className="account-pill" title={[code, name].filter(Boolean).join(" ")}>{code && <span className="account-pill-code">{code}</span>}{name && <span className="account-pill-name">{name}</span>}</span>;
}
