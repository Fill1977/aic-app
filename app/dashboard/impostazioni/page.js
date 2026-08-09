import { contestoOrg } from "@/lib/contestoOrg";
import Sidebar from "@/components/Sidebar";
import ScegliOrg from "@/components/ScegliOrg";
import DatiAziendali from "./DatiAziendali";
import GestioneTipologie from "./GestioneTipologie";
import GestioneAggiornamenti from "./GestioneAggiornamenti";
import "../../dashboard.css";
import "../../auth.css";

export const dynamic = "force-dynamic";
function Gate({titolo,messaggio}){return(<div className="gate"><div className="gate__box"><h1>{titolo}</h1><p>{messaggio}</p></div></div>);}

const SEZIONI = [
  { k: "dati", label: "Dati aziendali" },
  { k: "tipologie", label: "Tipologie corsi" },
  { k: "aggiornamenti", label: "Aggiornamenti" },
];

export default async function ImpostazioniPage({ searchParams }) {
  const ctx = await contestoOrg(searchParams);
  if (ctx.errore === "scegli_org") return <ScegliOrg orgs={ctx.orgs} />;
  if (ctx.errore) return <Gate titolo="Accesso non consentito" messaggio="Verifica di essere membro." />;
  const { supabase, sessione, slug, orgQuery } = ctx;

  const sp = await searchParams;
  const sez = sp?.sez || "dati";
  const q = orgQuery ? orgQuery + "&" : "?";

  let dati = null;
  if (sez === "tipologie") {
    const [{ data: tip }, { data: per }] = await Promise.all([
      supabase.rpc("tipologie_slug", { p_slug: slug }),
      supabase.rpc("periodicita_slug", { p_slug: slug }),
    ]);
    dati = { tipologie: tip || [], periodicita: per || [] };
  } else if (sez === "aggiornamenti") {
    const [{ data: corr }, { data: tip }] = await Promise.all([
      supabase.rpc("corrispondenze_slug", { p_slug: slug }),
      supabase.rpc("tipologie_slug", { p_slug: slug }),
    ]);
    dati = { corrispondenze: corr || [], tipologie: tip || [] };
  }

  return (
    <div className="shell">
      <Sidebar sessione={sessione} orgQuery={orgQuery} />
      <div className="main">
        <header className="topbar"><h1>Impostazioni</h1></header>
        <div className="content" style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          <nav className="submenu">
            {SEZIONI.map((s) => (
              <a key={s.k} href={`/dashboard/impostazioni${q}sez=${s.k}`}
                className={`submenu__item ${sez === s.k ? "submenu__item--active" : ""}`}>
                {s.label}
              </a>
            ))}
          </nav>
          <div style={{ flex: 1, minWidth: 0 }}>
            {sez === "dati" && <DatiAziendali sessione={sessione} slug={slug} />}
            {sez === "tipologie" && <GestioneTipologie dati={dati} slug={slug} />}
            {sez === "aggiornamenti" && <GestioneAggiornamenti dati={dati} slug={slug} />}
          </div>
        </div>
      </div>
    </div>
  );
}
