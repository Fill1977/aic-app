import { createBrowserClient } from "@supabase/ssr";

// Client per i Client Component (login, signup). Usa la publishable key.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
