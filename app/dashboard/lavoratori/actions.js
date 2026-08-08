"use server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function salvaLavoratore(slug, dati) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_lavoratore_slug", {
    p_slug: slug,
    p: {
      id: dati.id || null, sede_id: dati.sede_id || null,
      nome: dati.nome, cognome: dati.cognome, cod_fisc: dati.cod_fisc,
      email: dati.email, mansione: dati.mansione, centro_di_costo: dati.centro_di_costo,
      soggetto_sorveglianza_sanitaria: dati.soggetto_sorveglianza_sanitaria,
    },
  });
  if (error) {
    if (error.message?.includes("Cognome")) return { errore: "Il cognome è obbligatorio." };
    if (error.message?.includes("Permesso")) return { errore: "Non hai i permessi." };
    return { errore: "Salvataggio non riuscito." };
  }
  revalidatePath("/dashboard/lavoratori");
  return { ok: true };
}

export async function disattivaLavoratore(slug, id) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("disattiva_lavoratore_slug", { p_slug: slug, p_id: id });
  if (error) return { errore: "Operazione non riuscita." };
  revalidatePath("/dashboard/lavoratori");
  return { ok: true };
}
