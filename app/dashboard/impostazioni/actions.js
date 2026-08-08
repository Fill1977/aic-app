"use server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function salvaOrg(slug, d) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_org_slug", {
    p_slug: slug,
    p: { ragione_sociale: d.ragione_sociale, piva: d.piva, indirizzo: d.indirizzo,
      citta: d.citta, prov: d.prov, cap: d.cap, cod_ateco: d.cod_ateco,
      email: d.email, n_tel: d.n_tel },
  });
  if (error) {
    if (error.message?.includes("titolare")) return { errore: "Solo il titolare può modificare." };
    if (error.message?.includes("Ragione")) return { errore: "Ragione sociale obbligatoria." };
    return { errore: "Salvataggio non riuscito." };
  }
  revalidatePath("/dashboard/impostazioni");
  return { ok: true };
}
