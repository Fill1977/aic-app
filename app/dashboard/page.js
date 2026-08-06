import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { slugDaHost } from "@/lib/org";
import Sidebar from "@/components/Sidebar";
import Scadenzario from "@/components/Scadenzario";
import "../dashboard.css";

export const dynamic = "force-dynamic";

// Schermata di blocco riusata per i vari casi di accesso non valido.
function Gate({ titolo, messaggio }) {
  return (
    <div className="gate">
      <div className="gate__box">
        <h1>{titolo}</h1>
        <p>{messaggio}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }) {
  const supabase = supabaseServer();

  // 1. utente loggato?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. quale organizzazione? slug dal sottodominio, o da ?org= in sviluppo
  const slug = slugDaHost() || searchParams?.org || null;
  if (!slug) {
    return (
      <Gate
        titolo="Organizzazione non indicata"
        messaggio="Apri la dashboard dal sottodominio del tuo studio o azienda."
      />
    );
  }

  // 3. imposta il contesto org (la funzione verifica l'appartenenza)
  const { error: errCtx } = await supabase.rpc("usa_org", { p_slug: slug });
  if (errCtx) {
    return (
      <Gate
        titolo="Accesso non consentito"
        messaggio="Non risulti tra i membri di questa organizzazione, oppure lo studio indicato non esiste."
      />
    );
  }

  // 4. sessione (org + ruolo + branding) e scadenzario, in parallelo
  const [{ data: sessRows }, { data: righe, error: errScad }] = await Promise.all([
    supabase.rpc("mia_sessione"),
    supabase.rpc("get_scadenzario"),
  ]);

  const sessione = sessRows?.[0];
  if (!sessione) {
    return (
      <Gate
        titolo="Sessione non disponibile"
        messaggio="Non è stato possibile caricare i dati dell'organizzazione. Riprova tra poco."
      />
    );
  }

  const orgQuery = searchParams?.org ? `?org=${encodeURIComponent(searchParams.org)}` : "";

  return (
    <div className="shell">
      <Sidebar sessione={sessione} orgQuery={orgQuery} />
      <div className="main">
        <header className="topbar">
          <h1>Scadenzario</h1>
        </header>
        <div className="content">
          {errScad ? (
            <div className="vuoto">
              <h3>Impossibile caricare lo scadenzario</h3>
              <p>Si è verificato un errore nel recupero dei dati. Riprova.</p>
            </div>
          ) : (
            <Scadenzario righe={righe || []} />
          )}
        </div>
      </div>
    </div>
  );
}
