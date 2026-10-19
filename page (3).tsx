export const metadata = { title: "Access not approved · Chicago Brass Finance" };

export default function NotAuthorized() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="brand-mark" aria-hidden>CB</div>
        <h1>Access not approved</h1>
        <p className="muted">
          You signed in successfully, but your account isn&apos;t on the approved list for this app yet. Ask Ram to add you.
        </p>
        <form action="/auth/signout" method="post">
          <button className="btn" type="submit">Sign out</button>
        </form>
      </div>
    </main>
  );
}
