"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function salvaCliente(slug, dati) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("salva_cliente_slug", {
    p_slug: slug,
    p: {
      id: dati.id || null,
      azienda: dati.azienda, piva: dati.piva, indirizzo: dati.indirizzo,
      citta: dati.citta, prov: dati.prov, cap: dati.cap, cod_ateco: dati.cod_ateco,
      n_dipendenti: dati.n_dipendenti, mail: dati.mail, n_tel: dati.n_tel, note: dati.note,
    },
  });
  if (error) {
    if (error.message?.includes("obbligatoria")) return { errore: "Ragione sociale obbligatoria." };
    if (error.message?.includes("Permesso")) return { errore: "Non hai i permessi." };
    return { errore: "Salvataggio non riuscito." };
  }
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

export async function disattivaCliente(slug, id) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("archivia_cliente_slug", { p_slug: slug, p_id: id });
  if (error) return { errore: "Operazione non riuscita." };
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}
