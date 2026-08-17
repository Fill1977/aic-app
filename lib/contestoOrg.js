import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { slugDaHost } from "@/lib/org";

// Risolve utente + org + sessione, e arricchisce con lo stato trial.
// Ordine: sottodominio -> ?org= -> risoluzione automatica (se una sola org).
export async function contestoOrg(searchParams) {
  const sp = await searchParams;
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let slug = (await slugDaHost()) || sp?.org || null;

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

  // stato trial: arricchisco la sessione (usata già dalla Sidebar) senza toccare sessione_slug
  const { data: st } = await supabase.rpc("stato_trial_slug", { p_slug: slug });
  const t = st?.[0];
  if (t) {
    sessione.stato_org = t.stato;
    sessione.trial_scade_il = t.trial_scade_il;
    sessione.giorni_trial = t.giorni_rimasti;
    sessione.readonly = !!t.readonly;
  }

  const orgQuery = `?org=${encodeURIComponent(slug)}`;
  return { supabase, sessione, slug, orgQuery, user, readonly: !!t?.readonly, giorniTrial: t?.giorni_rimasti };
}
