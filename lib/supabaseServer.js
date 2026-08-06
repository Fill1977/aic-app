import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase per Server Components / Route Handlers.
// Legge la sessione utente dai cookie (gestiti da @supabase/ssr).
export function supabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,   // publishable/anon: RLS attiva
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // chiamato da un Server Component: i cookie li scrive il middleware
          }
        },
      },
    }
  );
}
