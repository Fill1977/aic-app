"use server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function salvaSede(slug, dati) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_sede_slug", {
    p_slug: slug,
    p: { id: dati.id||null, cliente_id: dati.cliente_id,
      nome: dati.nome, indirizzo: dati.indirizzo, citta: dati.citta,
      prov: dati.prov, cap: dati.cap, email: dati.email, note: dati.note },
  });
  if (error) {
    if (error.message?.includes("Nome")) return { errore: "Il nome della sede è obbligatorio." };
    if (error.message?.includes("Permesso")) return { errore: "Non hai i permessi." };
    return { errore: "Salvataggio non riuscito." };
  }
  revalidatePath("/dashboard/sedi");
  return { ok: true };
}

export async function archiviaSede(slug, id) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("archivia_sede_slug", { p_slug: slug, p_id: id });
  if (error) {
    if (error.message?.includes("legale")) return { errore: "Non puoi archiviare la sede legale." };
    return { errore: "Operazione non riuscita." };
  }
  revalidatePath("/dashboard/sedi");
  return { ok: true };
}
