"use server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function salvaCorso(slug, dati) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_corso_slug", {
    p_slug: slug,
    p: { id: dati.id||null, id_tipologia: dati.id_tipologia,
      cod_corso: dati.cod_corso, docente: dati.docente, societa: dati.societa,
      sede: dati.sede, data_fine_corso: dati.data_fine_corso, note: dati.note },
  });
  if (error) {
    if (error.message?.includes("Tipologia")) return { errore: "Seleziona la tipologia di corso." };
    if (error.message?.includes("Permesso")) return { errore: "Non hai i permessi." };
    return { errore: "Salvataggio non riuscito." };
  }
  revalidatePath("/dashboard/corsi");
  return { ok: true };
}

export async function eliminaCorso(slug, id) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("elimina_corso_slug", { p_slug: slug, p_id: id });
  if (error) return { errore: "Operazione non riuscita." };
  revalidatePath("/dashboard/corsi");
  return { ok: true };
}

export async function iscrivi(slug, corsoId, lavoratoreId) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("iscrivi_slug", { p_slug: slug, p_corso: corsoId, p_lav: lavoratoreId });
  if (error) return { errore: "Iscrizione non riuscita." };
  revalidatePath("/dashboard/corsi");
  return { ok: true };
}

export async function disiscrivi(slug, iscrizioneId) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("disiscrivi_slug", { p_slug: slug, p_isc: iscrizioneId });
  if (error) return { errore: "Operazione non riuscita." };
  revalidatePath("/dashboard/corsi");
  return { ok: true };
}

export async function caricaIscritti(slug, corsoId) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("iscritti_slug", { p_slug: slug, p_corso: corsoId });
  if (error) return { errore: "Caricamento non riuscito.", iscritti: [] };
  return { iscritti: data || [] };
}



