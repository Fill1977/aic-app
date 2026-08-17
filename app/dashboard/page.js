import { contestoOrg } from "@/lib/contestoOrg";
import Sidebar from "@/components/Sidebar";
import ScegliOrg from "@/components/ScegliOrg";
import Scadenzario from "@/components/Scadenzario";
import "../dashboard.css";

export const dynamic = "force-dynamic";

function Gate({ titolo, messaggio }) {
  return (
    <div className="gate"><div className="gate__box">
      <h1>{titolo}</h1><p>{messaggio}</p>
    </div></div>
  );
}

export default async function DashboardPage({ searchParams }) {
  const ctx = await contestoOrg(searchParams);
  if (ctx.errore === "scegli_org") return <ScegliOrg orgs={ctx.orgs} />;
  if (ctx.errore === "nessuna_org")
    return <Gate titolo="Nessuno spazio" messaggio="Il tuo account non è collegato a nessuna organizzazione." />;
  if (ctx.errore === "no_org")
    return <Gate titolo="Organizzazione non indicata" messaggio="Apri dal sottodominio del tuo spazio." />;
  if (ctx.errore)
    return <Gate titolo="Accesso non consentito" messaggio="Verifica di essere membro di questa organizzazione." />;

  const { supabase, sessione, slug, orgQuery } = ctx;
  const { data: righe, error } = await supabase.rpc("scadenzario_unificato_slug", { p_slug: slug });

  return (
    <div className="shell">
      <Sidebar sessione={sessione} orgQuery={orgQuery} />
      <div className="main">
        <header className="topbar"><h1>Scadenzario</h1></header>
        <div className="content">
          {error
            ? <div className="vuoto"><h3>Impossibile caricare lo scadenzario</h3><p>Riprova.</p></div>
            : <Scadenzario righe={righe || []} slug={slug} />}
        </div>
      </div>
    </div>
  );
}
