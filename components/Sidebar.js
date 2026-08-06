"use client";

import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useState } from "react";

const VOCI = [
  { k: "scadenzario", label: "Scadenzario", href: "/dashboard", pronta: true },
  { k: "lavoratori", label: "Lavoratori", href: "/dashboard/lavoratori", pronta: false },
  { k: "corsi", label: "Corsi", href: "/dashboard/corsi", pronta: false },
  { k: "visite", label: "Sorveglianza sanitaria", href: "/dashboard/visite", pronta: false },
  { k: "adempimenti", label: "Adempimenti", href: "/dashboard/adempimenti", pronta: false },
];

export default function Sidebar({ sessione, orgQuery = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => supabaseBrowser());
  const [uscendo, setUscendo] = useState(false);

  async function esci() {
    setUscendo(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function vai(voce) {
    if (!voce.pronta) return;
    router.push(voce.href + orgQuery);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        {sessione.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="sidebar__logo" src={sessione.logo_url} alt="" />
        ) : (
          <span className="sidebar__logo sidebar__logo--ph">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.6l5.2 5.2L20 7" stroke="#04121F" strokeWidth="2.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="sidebar__org">{sessione.ragione_sociale}</div>
          <div className="sidebar__tipo">
            {sessione.tipo === "studio" ? "Studio" : "Azienda"}
          </div>
        </div>
      </div>

      <nav className="nav">
        {VOCI.map((v) => {
          const attiva = v.pronta && pathname === v.href;
          return (
            <button
              key={v.k}
              className={`nav__item ${attiva ? "nav__item--active" : ""} ${!v.pronta ? "nav__item--soon" : ""}`}
              onClick={() => vai(v)}
              title={v.pronta ? "" : "In arrivo"}
            >
              <span className="nav__dot" />
              {v.label}
              {!v.pronta && <span className="nav__soon">presto</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__user">
        <div className="sidebar__email" title={sessione.email || ""}>
          {sessione.email || "Utente"}
        </div>
        <button className="sidebar__logout" onClick={esci} disabled={uscendo}>
          {uscendo ? "Uscita…" : "Esci"}
        </button>
      </div>
    </aside>
  );
}
