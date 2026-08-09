"use server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

// --- DATI AZIENDALI ---
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

// --- TIPOLOGIE ---
export async function caricaTipologie(slug) {
  const supabase = await supabaseServer();
  const [{ data: tip }, { data: per }] = await Promise.all([
    supabase.rpc("tipologie_slug", { p_slug: slug }),
    supabase.rpc("periodicita_slug", { p_slug: slug }),
  ]);
  return { tipologie: tip || [], periodicita: per || [] };
}
export async function salvaTipologia(slug, d) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_tipologia_slug", {
    p_slug: slug, p: { id: d.id||null, tipologia: d.tipologia, id_periodicita: d.id_periodicita, durata_ore: d.durata_ore },
  });
  if (error) {
    if (error.message?.includes("obbligatorio")) return { errore: "Nome tipologia obbligatorio." };
    if (error.message?.includes("sistema")) return { errore: "Non modificabile (di sistema)." };
    return { errore: "Salvataggio non riuscito." };
  }
  revalidatePath("/dashboard/impostazioni");
  return { ok: true };
}
export async function eliminaTipologia(slug, id) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("elimina_tipologia_slug", { p_slug: slug, p_id: id });
  if (error) {
    if (error.message?.includes("usata")) return { errore: "Tipologia usata in un corso." };
    if (error.message?.includes("sistema")) return { errore: "Non eliminabile (di sistema)." };
    return { errore: "Operazione non riuscita." };
  }
  revalidatePath("/dashboard/impostazioni");
  return { ok: true };
}

// --- CORRISPONDENZE (catene aggiornamento) ---
export async function caricaCorrispondenze(slug) {
  const supabase = await supabaseServer();
  const [{ data: corr }, { data: tip }] = await Promise.all([
    supabase.rpc("corrispondenze_slug", { p_slug: slug }),
    supabase.rpc("tipologie_slug", { p_slug: slug }),
  ]);
  return { corrispondenze: corr || [], tipologie: tip || [] };
}
export async function salvaCorrispondenza(slug, base, agg) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_corrispondenza_slug", { p_slug: slug, p_base: base, p_agg: agg });
  if (error) {
    if (error.message?.includes("coincidere")) return { errore: "Base e aggiornamento non possono coincidere." };
    return { errore: "Salvataggio non riuscito." };
  }
  revalidatePath("/dashboard/impostazioni");
  return { ok: true };
}
export async function eliminaCorrispondenza(slug, id) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("elimina_corrispondenza_slug", { p_slug: slug, p_id: id });
  if (error) {
    if (error.message?.includes("sistema")) return { errore: "Non eliminabile (di sistema)." };
    return { errore: "Operazione non riuscita." };
  }
  revalidatePath("/dashboard/impostazioni");
  return { ok: true };
}
