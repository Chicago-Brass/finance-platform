import { ChangePasswordForm } from "./ChangePasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Change password · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="brand-mark" aria-hidden>CB</div>
        <h1>Change password</h1>
        <p className="muted">Signed in as {user?.email}</p>
        <ChangePasswordForm />
        <p className="muted back-link"><a href="/income-statement">Back to reports</a></p>
      </div>
    </main>
  );
}
