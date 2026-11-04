"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReportIcon } from "./ReportIcons";

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string };

export function LoginForm({ microsoftEnabled, domain }: { microsoftEnabled: boolean; domain: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [showPassword, setShowPassword] = useState(false);
  const busy = status.kind === "busy";

  async function signInWithMicrosoft() {
    setStatus({ kind: "busy" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: { scopes: "email", redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setStatus({ kind: "error", message: error.message });
    } catch {
      setStatus({ kind: "error", message: "We couldn't connect. Please try again." });
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith(`@${domain}`)) {
      setStatus({ kind: "error", message: `Use your @${domain} email address.` });
      return;
    }
    setStatus({ kind: "busy" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: clean, password });
      if (error) {
        // Same message for wrong email or wrong password, so we don't reveal which accounts exist.
        setStatus({ kind: "error", message: "Email or password is incorrect. Ask Ram if you need your password reset." });
        return;
      }
      window.location.assign("/income-statement");
    } catch {
      setStatus({ kind: "error", message: "We couldn't connect. Please try again." });
    }
  }

  return (
    <div className="landing-login-actions">
      {microsoftEnabled && (
        <>
          <button type="button" className="landing-microsoft" onClick={signInWithMicrosoft} disabled={busy}>
            Sign in with Microsoft
          </button>
          <div className="landing-divider"><span>or use your work email</span></div>
        </>
      )}
      <form onSubmit={signIn} className="landing-form" aria-label="Sign in" aria-busy={busy}>
        <div className="landing-field">
          <label htmlFor="email">Work email</label>
          <div className="landing-input">
            <ReportIcon name="mail" />
            <input id="email" type="email" autoComplete="username" required disabled={busy} spellCheck={false} autoCapitalize="none" placeholder={`name@${domain}`} value={email} onChange={event => setEmail(event.target.value)} />
          </div>
        </div>
        <div className="landing-field">
          <label htmlFor="password">Password</label>
          <div className="landing-input">
            <ReportIcon name="lock" />
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={busy} placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} />
            <button type="button" className="landing-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} disabled={busy}><ReportIcon name={showPassword ? "eyeOff" : "eye"} /></button>
          </div>
        </div>
        <button type="submit" className="landing-submit" disabled={busy}>
          {busy ? <><span className="landing-spinner" aria-hidden="true" />Signing in...</> : <>Continue<ReportIcon name="arrowRight" /></>}
        </button>
      </form>
      {status.kind === "error" && <p className="landing-notice" role="alert">{status.message}</p>}
    </div>
  );
}
