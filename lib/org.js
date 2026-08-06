import { headers } from "next/headers";

// Estrae lo slug dell'organizzazione dal sottodominio della richiesta.
//   studiorossi.adempimentiincloud.it -> "studiorossi"
//   adempimentiincloud.it             -> null (dominio radice, nessuna org)
//   localhost / preview vercel        -> legge da ?org= per lo sviluppo
export function slugDaHost() {
  const h = headers();
  const host = (h.get("host") || "").split(":")[0].toLowerCase();

  // sviluppo: su localhost non ci sono sottodomini reali
  if (host === "localhost" || host.endsWith(".vercel.app") || host === "127.0.0.1") {
    return null; // in dev lo slug arriva dalla query, vedi risolviOrg()
  }

  const parti = host.split(".");
  // adempimentiincloud.it -> ['adempimentiincloud','it'] (2 parti = radice)
  if (parti.length <= 2) return null;

  const sub = parti[0];
  if (sub === "www" || sub === "app") return null;
  return sub;
}
