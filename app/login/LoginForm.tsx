"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string };

export function LoginForm({ microsoftEnabled, domain }: { microsoftEnabled: boolean; domain: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function signInWithMicrosoft() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "email", redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setStatus({ kind: "error", message: error.message });
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith(`@${domain}`)) {
      setStatus({ kind: "error", message: `Use your @${domain} email address.` });
      return;
    }
    setStatus({ kind: "busy" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: clean, password });
    if (error) {
      // Same message for wrong email or wrong password, so we don't reveal which accounts exist.
      setStatus({ kind: "error", message: "Email or password is incorrect. Ask Ram if you need your password reset." });
      return;
    }
    window.location.assign("/income-statement");
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
      <form onSubmit={signIn} className="stack">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          placeholder={`name@${domain}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className={microsoftEnabled ? "btn" : "btn btn-primary"} disabled={status.kind === "busy"}>
          {status.kind === "busy" ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {status.kind === "error" && <p className="notice notice-warn">{status.message}</p>}
    </div>
  );
}
