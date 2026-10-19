/**
 * Public configuration. These values are shipped to every browser by design;
 * data is protected by Supabase Row Level Security, not by hiding them.
 * Environment variables (set in Vercel) override the defaults.
 * NEVER put the Supabase service_role / secret key here or anywhere in Git.
 */
const DEFAULTS = {
  url: "https://inzobaubbikyiekcfarj.supabase.co",
  key: "sb_publishable_eHgLsLd5wlO6GbauCor0TQ_xpCCjvYw",
  domain: "chicagobrass.com",
};

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULTS.url;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULTS.key;
  return { url, key };
}

export const allowedEmailDomain = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || DEFAULTS.domain).toLowerCase();

// Flip to "true" in Vercel once the Microsoft Entra app is registered and the
// Azure provider is enabled in Supabase Auth.
export const microsoftLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN === "true";
