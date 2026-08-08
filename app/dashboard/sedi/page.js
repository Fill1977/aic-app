import { contestoOrg } from "@/lib/contestoOrg";
import Sidebar from "@/components/Sidebar";
import ScegliOrg from "@/components/ScegliOrg";
import SediView from "./SediView";
import "../../dashboard.css";
import "../../auth.css";

export const dynamic = "force-dynamic";
function Gate({titolo,messaggio}){return(<div className="gate"><div className="gate__box"><h1>{titolo}</h1><p>{messaggio}</p></div></div>);}

export default async function SediPage({ searchParams }) {
  const ctx = await contestoOrg(searchParams);
  if (ctx.errore === "scegli_org") return <ScegliOrg orgs={ctx.orgs} />;
  if (ctx.errore === "nessuna_org") return <Gate titolo="Nessuno spazio" messaggio="Account non collegato a un'organizzazione." />;
  if (ctx.errore) return <Gate titolo="Accesso non consentito" messaggio="Verifica di essere membro." />;

  const { supabase, sessione, slug, orgQuery } = ctx;
  const [{ data: clienti }, { data: sedi }] = await Promise.all([
    supabase.rpc("clienti_slug", { p_slug: slug }),
    supabase.rpc("tutte_sedi_slug", { p_slug: slug }),
  ]);

  return (
    <div className="shell">
      <Sidebar sessione={sessione} orgQuery={orgQuery} />
      <div className="main">
        <header className="topbar"><h1>Sedi</h1></header>
        <div className="content">
          <SediView sedi={sedi||[]} clienti={clienti||[]} slug={slug} tipoOrg={sessione.tipo} />
        </div>
      </div>
    </div>
  );
}
