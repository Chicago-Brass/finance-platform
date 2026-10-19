"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; email: string } | { kind: "error"; message: string };

export function LoginForm({ microsoftEnabled, domain }: { microsoftEnabled: boolean; domain: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function signInWithMicrosoft() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "email", redirectTo: redirectTo() },
    });
    if (error) setStatus({ kind: "error", message: error.message });
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith(`@${domain}`)) {
      setStatus({ kind: "error", message: `Use your @${domain} email address.` });
      return;
    }
    setStatus({ kind: "sending" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: redirectTo() },
    });
    setStatus(error ? { kind: "error", message: error.message } : { kind: "sent", email: clean });
  }

  if (status.kind === "sent") {
    return (
      <p className="notice notice-ok">
        Check your inbox at <strong>{status.email}</strong> and click the sign-in link. You can close this tab.
      </p>
    );
  }

  return (
    <div className="login-actions">
      {microsoftEnabled && (
        <>
          <button type="button" className="btn btn-primary" onClick={signInWithMicrosoft}>
            Sign in with Microsoft
          </button>
          <div className="divider"><span>or</span></div>
        </>
      )}
      <form onSubmit={sendLink} className="stack">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          placeholder={`name@${domain}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className={microsoftEnabled ? "btn" : "btn btn-primary"} disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      {status.kind === "error" && <p className="notice notice-warn">{status.message}</p>}
    </div>
  );
}
