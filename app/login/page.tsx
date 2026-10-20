import { LoginForm } from "./LoginForm";
import { microsoftLoginEnabled, allowedEmailDomain } from "@/lib/supabase/config";

export const metadata = { title: "Sign in · Chicago Brass Finance" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="brand-mark" aria-hidden>CB</div>
        <h1>Chicago Brass Finance</h1>
        <p className="muted">Sign in with your @{allowedEmailDomain} account.</p>
        {error === "link" && (
          <p className="notice notice-warn">That sign-in attempt didn&apos;t complete. Please sign in again.</p>
        )}
        <LoginForm microsoftEnabled={microsoftLoginEnabled} domain={allowedEmailDomain} />
      </div>
    </main>
  );
}
