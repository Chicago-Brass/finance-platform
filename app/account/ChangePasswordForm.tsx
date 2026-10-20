"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MIN = 12;

export function ChangePasswordForm() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < MIN) return setMsg({ ok: false, text: `Use at least ${MIN} characters.` });
    if (pw !== pw2) return setMsg({ ok: false, text: "The two passwords don't match." });
    if (pw === "ChicagoBrass2026!") return setMsg({ ok: false, text: "Choose a password different from the temporary one." });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setPw("");
    setPw2("");
    setMsg({ ok: true, text: "Password changed. Use it next time you sign in." });
  }

  return (
    <form onSubmit={submit} className="stack">
      <label htmlFor="pw">New password</label>
      <input id="pw" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
      <label htmlFor="pw2">Confirm new password</label>
      <input id="pw2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
      {msg && <p className={`notice ${msg.ok ? "notice-ok" : "notice-warn"}`}>{msg.text}</p>}
    </form>
  );
}
