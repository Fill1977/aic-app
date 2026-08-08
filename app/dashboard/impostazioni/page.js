import { contestoOrg } from "@/lib/contestoOrg";
import Sidebar from "@/components/Sidebar";
import ScegliOrg from "@/components/ScegliOrg";
import ImpostazioniView from "./ImpostazioniView";
import "../../dashboard.css";
import "../../auth.css";

export const dynamic = "force-dynamic";
function Gate({titolo,messaggio}){return(<div className="gate"><div className="gate__box"><h1>{titolo}</h1><p>{messaggio}</p></div></div>);}

export default async function ImpostazioniPage({ searchParams }) {
  const ctx = await contestoOrg(searchParams);
  if (ctx.errore === "scegli_org") return <ScegliOrg orgs={ctx.orgs} />;
  if (ctx.errore) return <Gate titolo="Accesso non consentito" messaggio="Verifica di essere membro." />;
  const { sessione, slug, orgQuery } = ctx;

  return (
    <div className="shell">
      <Sidebar sessione={sessione} orgQuery={orgQuery} />
      <div className="main">
        <header className="topbar"><h1>Impostazioni</h1></header>
        <div className="content" style={{ display: "flex", gap: 28 }}>
          <nav className="submenu">
            <div className="submenu__item submenu__item--active">Dati aziendali</div>
          </nav>
          <div style={{ flex: 1 }}>
            <ImpostazioniView sessione={sessione} slug={slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
