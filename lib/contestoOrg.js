import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { slugDaHost } from "@/lib/org";

// Risolve utente + org + sessione.
// Ordine: sottodominio -> ?org= -> risoluzione automatica (se l'utente ha
// una sola org). Nessuno stato tra chiamate, nessuna query annidata.
export async function contestoOrg(searchParams) {
  const sp = await searchParams;
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let slug = (await slugDaHost()) || sp?.org || null;

  // Fallback: se non c'è slug, chiedo al DB le org dell'utente.
  let orgs = null;
  if (!slug) {
    const { data } = await supabase.rpc("mie_org");
    orgs = data || [];
    if (orgs.length === 1) slug = orgs[0].slug;
    else if (orgs.length === 0) return { errore: "nessuna_org" };
    else return { errore: "scegli_org", orgs };
  }

  const { data: sessRows, error } = await supabase.rpc("sessione_slug", { p_slug: slug });
  const sessione = sessRows?.[0];
  if (error || !sessione) return { errore: "accesso" };

  const orgQuery = `?org=${encodeURIComponent(slug)}`;
  return { supabase, sessione, slug, orgQuery, user };
}
