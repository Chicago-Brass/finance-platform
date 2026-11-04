import { redirect } from "next/navigation";
import Image from "next/image";
import localFont from "next/font/local";
import { createClient } from "@/lib/supabase/server";
import { allowedEmailDomain, microsoftLoginEnabled } from "@/lib/supabase/config";
import { LoginForm } from "@/components/LoginForm";
import "./landing.css";

const manrope = localFont({ src: "./fonts/manrope-latin.woff2", weight: "400 700", display: "swap", variable: "--font-landing-sans" });
const sourceSerif = localFont({ src: "./fonts/source-serif-4-latin.woff2", weight: "400 600", display: "swap", variable: "--font-landing-serif" });

export const metadata = { title: "Sign in - Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (user) redirect("/income-statement");
  const { error } = await searchParams;
  return (
    <main className={`landing ${manrope.variable} ${sourceSerif.variable}`}>
      <Image className="landing-art" src="/images/finance-landing-background.png" alt="" fill sizes="100vw" quality={90} priority aria-hidden="true" />
      <div className="landing-content">
        <header className="landing-brand">
          <h1>Chicago Brass</h1>
          <p>Financial reporting, in one place.</p>
        </header>
        <section className="landing-card" aria-labelledby="sign-in-title">
          <header className="landing-card-heading">
            <p className="landing-workspace">Finance workspace</p>
            <h2 id="sign-in-title">Sign in</h2>
            <p>Welcome back to Chicago Brass</p>
          </header>
          {error === "link" && <p className="landing-notice" role="alert">That sign-in attempt didn&apos;t complete. Please sign in again.</p>}
          <LoginForm microsoftEnabled={microsoftLoginEnabled} domain={allowedEmailDomain} />
          <p className="landing-card-footer">Use your Chicago Brass work account.</p>
        </section>
      </div>
    </main>
  );
}
