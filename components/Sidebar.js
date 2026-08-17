"use client";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useState } from "react";

const VOCI = [
  { k: "scadenzario", label: "Scadenzario", href: "/dashboard", pronta: true },
  { k: "clienti", label: "Clienti", href: "/dashboard/clienti", pronta: true, soloStudio: true },
  { k: "sedi", label: "Sedi", href: "/dashboard/sedi", pronta: true },
  { k: "lavoratori", label: "Lavoratori", href: "/dashboard/lavoratori", pronta: true },
  { k: "corsi", label: "Corsi", href: "/dashboard/corsi", pronta: true },
  { k: "visite", label: "Sorveglianza sanitaria", href: "/dashboard/visite", pronta: true },
  { k: "adempimenti", label: "Adempimenti", href: "/dashboard/adempimenti", pronta: true },
  { k: "impostazioni", label: "Impostazioni", href: "/dashboard/impostazioni", pronta: true },
];

export default function Sidebar({ sessione, orgQuery = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => supabaseBrowser());
  const [uscendo, setUscendo] = useState(false);

  async function esci() {
    setUscendo(true);
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  }

  const inTrial = sessione.stato_org === "trial";
  const gg = sessione.giorni_trial;
  const mostraTrial = inTrial && !sessione.readonly && gg != null && gg <= 3;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        {sessione.logo_url ? (
          <img className="sidebar__logo" src={sessione.logo_url} alt="" />
        ) : (
          <span className="sidebar__logo sidebar__logo--ph">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.6l5.2 5.2L20 7" stroke="#04121F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="sidebar__org">{sessione.ragione_sociale}</div>
          <div className="sidebar__tipo">{sessione.tipo === "studio" ? "Studio" : "Azienda"}</div>
        </div>
      </div>

      {sessione.readonly && (
        <div style={{ margin: "10px 12px", padding: "10px 12px", borderRadius: 10,
          background: "#fdecec", border: "1px solid #f3b4b4", color: "#8a1f1f", fontSize: 12.5, lineHeight: 1.35 }}>
          <strong>Prova scaduta.</strong> Aggiungi un metodo di pagamento per continuare a usare tutte le funzioni.
        </div>
      )}
      {mostraTrial && (
        <div style={{ margin: "10px 12px", padding: "8px 12px", borderRadius: 10,
          background: "#fff6e5", border: "1px solid #f0d38a", color: "#7a5b12", fontSize: 12.5 }}>
          Prova gratuita: <strong>{gg} {gg === 1 ? "giorno" : "giorni"}</strong> {gg === 1 ? "rimasto" : "rimasti"}.
        </div>
      )}

      <nav className="nav">
        {VOCI.map((v) => {
          const disabilitata = v.soloStudio && sessione.tipo === "azienda";
          const pronta = v.pronta && !disabilitata;
          const attiva = pronta && pathname === v.href;
          return (
            <button key={v.k}
              className={`nav__item ${attiva ? "nav__item--active" : ""} ${!pronta ? "nav__item--soon" : ""}`}
              onClick={() => pronta && router.push(v.href + orgQuery)}
              title={pronta ? "" : (disabilitata ? "Non disponibile" : "In arrivo")}>
              <span className="nav__dot" />
              {v.label}
              {!pronta && !v.soloStudio && <span className="nav__soon">presto</span>}
            </button>
          );
        })}
      </nav>
      <div className="sidebar__user">
        <div className="sidebar__email" title={sessione.email || ""}>{sessione.email || "Utente"}</div>
        <button className="sidebar__logout" onClick={esci} disabled={uscendo}>{uscendo ? "Uscita…" : "Esci"}</button>
      </div>
    </aside>
  );
}
