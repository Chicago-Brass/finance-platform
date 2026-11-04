import { redirect } from "next/navigation";

/** Keep existing bookmarks and sign-in links pointing to the new landing page. */
export default async function LegacyLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  redirect(error === "link" ? "/?error=link" : "/");
}
