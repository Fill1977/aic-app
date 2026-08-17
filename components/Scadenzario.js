"use client";

import { useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const SOGLIA_SCADENZA_GG = 90;

function statoDi(r) {
  if (r.avviso === "senza_corso") return "senza";
  if (r.avviso === "senza_visita") return "senzavisita";
  if (r.avviso === "da_fare") return "dafare";
  if (r.illimitato || r.giorni === null) return "illim";
  if (r.giorni < 0) return "scaduto";
  if (r.giorni <= SOGLIA_SCADENZA_GG) return "imminente";
  return "ok";
}

function fmtData(dataStr) {
  if (!dataStr) return "—";
  return new Date(dataStr).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function testoScadenza(r) {
  if (r.illimitato) return "illimitata";
  if (r.avviso) return "—";
  if (r.giorni === null) return "—";
  if (r.giorni < 0) return `${Math.abs(r.giorni)} gg fa`;
  if (r.giorni === 0) return "oggi";
  return `tra ${r.giorni} gg`;
}

const LABEL = {
  scaduto: "Scaduto", imminente: "In scadenza", ok: "Valido", illim: "Illimitato",
  senza: "Nessun corso", senzavisita: "Nessuna visita", dafare: "Da fare",
};
const PILL = {
  scaduto: "scaduto", imminente: "imminente", ok: "ok", illim: "ok",
  senza: "scaduto", senzavisita: "scaduto", dafare: "scaduto",
};
const AMBITO_LABEL = { corso: "Corso", visita: "Visita", adempimento: "Adempimento" };

export default function Scadenzario({ righe, slug }) {
  const [supabase] = useState(() => supabaseBrowser());
  const [sit, setSit] = useState(null); // {nome, righe:[]}
  const [filtro, setFiltro] = useState("tutti");
  const [ambito, setAmbito] = useState("tutti");
  const [q, setQ] = useState("");

  const conStato = useMemo(() => righe.map((r) => ({ ...r, _stato: statoDi(r) })), [righe]);

  const conteggi = useMemo(() => {
    const c = { scaduto: 0, imminente: 0, ok: 0, illim: 0, senza: 0, senzavisita: 0, dafare: 0 };
    conStato.forEach((r) => { c[r._stato] = (c[r._stato] || 0) + 1; });
    return c;
  }, [conStato]);

  const visibili = useMemo(() => {
    const query = q.trim().toLowerCase();
    return conStato
      .filter((r) => {
        if (ambito !== "tutti" && r.ambito !== ambito) return false;
        if (filtro === "scaduti" && r._stato !== "scaduto") return false;
        if (filtro === "scadenza" && r._stato !== "imminente") return false;
        if (filtro === "validi" && !["ok", "illim"].includes(r._stato)) return false;
        if (filtro === "senza" && r._stato !== "senza") return false;
        if (filtro === "senzavisita" && r._stato !== "senzavisita") return false;
        if (filtro === "dafare" && r._stato !== "dafare") return false;
        if (query) {
          const blob = `${r.soggetto} ${r.sotto || ""} ${r.descrizione || ""} ${r.azienda || ""} ${r.riferimento || ""}`.toLowerCase();
          if (!blob.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ordine = { scaduto: 0, dafare: 1, senza: 1, senzavisita: 1, imminente: 2, ok: 3, illim: 4 };
        if (ordine[a._stato] !== ordine[b._stato]) return ordine[a._stato] - ordine[b._stato];
        const ga = a.giorni ?? 99999, gb = b.giorni ?? 99999;
        return ga - gb;
      });
  }, [conStato, filtro, ambito, q]);

  async function apriSituazione(lavId, nome) {
    if (!lavId) return;
    setSit({ nome, righe: null });
    const { data } = await supabase.rpc("situazione_lavoratore_slug", { p_slug: slug, p_lavoratore_id: lavId });
    setSit({ nome, righe: data || [] });
  }
  function pillSit(ds) {
    if (!ds) return { k: "ok", label: "—" };
    const oggi = new Date(); oggi.setHours(0,0,0,0);
    const g = Math.round((new Date(ds) - oggi) / 86400000);
    if (g < 0) return { k: "scaduto", label: `scaduto da ${-g}g` };
    if (g <= SOGLIA_SCADENZA_GG) return { k: "imminente", label: `tra ${g}g` };
    return { k: "ok", label: "valido" };
  }

  return (
    <>
      <div className="riepilogo">
        <div className="kpi kpi--scaduto"><div className="kpi__num">{conteggi.scaduto}</div><div className="kpi__label">Scaduti</div></div>
        <div className="kpi kpi--imminente"><div className="kpi__num">{conteggi.imminente}</div><div className="kpi__label">In scadenza entro {SOGLIA_SCADENZA_GG} giorni</div></div>
        <div className="kpi kpi--ok"><div className="kpi__num">{conteggi.ok + conteggi.illim}</div><div className="kpi__label">In regola</div></div>
      </div>

      {conteggi.senza > 0 && (
        <div className="avviso">
          <div className="avviso__titolo">{conteggi.senza} {conteggi.senza === 1 ? "lavoratore" : "lavoratori"} senza alcun corso registrato</div>
          <div className="avviso__sub">La formazione generale (art. 37 D.Lgs. 81/08) è obbligatoria per tutti i lavoratori.</div>
        </div>
      )}
      {conteggi.senzavisita > 0 && (
        <div className="avviso">
          <div className="avviso__titolo">{conteggi.senzavisita} {conteggi.senzavisita === 1 ? "lavoratore soggetto" : "lavoratori soggetti"} a sorveglianza sanitaria senza visita</div>
          <div className="avviso__sub">La sorveglianza sanitaria (art. 41 D.Lgs. 81/08) richiede la visita del medico competente.</div>
        </div>
      )}
      {conteggi.dafare > 0 && (
        <div className="avviso">
          <div className="avviso__titolo">{conteggi.dafare} {conteggi.dafare === 1 ? "adempimento applicabile" : "adempimenti applicabili"} non ancora registrati</div>
          <div className="avviso__sub">Adempimenti dovuti per le sedi ma mai eseguiti o non ancora inseriti a sistema.</div>
        </div>
      )}

      <div className="filtri">
        {[["tutti","Tutti"],["scaduti","Scaduti"],["scadenza","In scadenza"],["validi","Validi"],
          ["senza","Senza corsi"],["senzavisita","Senza visita"],["dafare","Da fare"]].map(([k, label]) => (
          <button key={k} className={`chip ${filtro === k ? "chip--on" : ""}`} onClick={() => setFiltro(k)}>{label}</button>
        ))}
      </div>

      <div className="filtri">
        {[["tutti","Tutti gli ambiti"],["corso","Corsi"],["visita","Visite"],["adempimento","Adempimenti"]].map(([k, label]) => (
          <button key={k} className={`chip ${ambito === k ? "chip--on" : ""}`} onClick={() => setAmbito(k)}>{label}</button>
        ))}
        <input className="search" placeholder="Cerca per nome, voce, azienda…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {visibili.length === 0 ? (
        <div className="vuoto"><h3>Nessun risultato</h3><p>Nessuna riga corrisponde ai filtri attivi.</p></div>
      ) : (
        <div className="tabella-wrap">
          <table className="scad">
            <thead>
              <tr>
                <th>Soggetto</th>
                <th className="cell-hide-sm">Azienda / sede</th>
                <th>Voce</th>
                <th style={{ textAlign: "right" }}>Scadenza</th>
                <th style={{ textAlign: "right" }}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {visibili.map((r, i) => (
                <tr key={`${r.ambito}-${r.lavoratore_id ?? r.sede_id ?? "x"}-${r.descrizione ?? ""}-${i}`}>
                  <td>
                    {r.lavoratore_id ? (
                      <div className="cell-nome" style={{cursor:"pointer",textDecoration:"underline dotted",textUnderlineOffset:3}}
                        onClick={()=>apriSituazione(r.lavoratore_id, r.soggetto)}>{r.soggetto}</div>
                    ) : (
                      <div className="cell-nome">{r.soggetto}</div>
                    )}
                    {r.sotto && <div className="cell-sub">{r.sotto}</div>}
                  </td>
                  <td className="cell-hide-sm">
                    <span className="cell-azienda">{r.azienda || "Privatista"}</span>
                    {r.sede && <div className="cell-sub">{r.sede}</div>}
                  </td>
                  <td>
                    <div className="cell-corso">
                      <span className="nav__soon" style={{ marginRight: 6 }}>{AMBITO_LABEL[r.ambito]}</span>
                      {r.avviso === "senza_corso" ? <span style={{ color: "var(--scaduto)" }}>Nessun corso</span>
                       : r.avviso === "senza_visita" ? <span style={{ color: "var(--scaduto)" }}>Visita mancante</span>
                       : r.avviso === "da_fare" ? <span style={{ color: "var(--scaduto)" }}>{r.descrizione} — da registrare</span>
                       : r.descrizione}
                    </div>
                    {r.aggiornamento && r.aggiornamento !== r.descrizione && <div className="cell-agg">→ {r.aggiornamento}</div>}
                    {r.riferimento && !r.avviso && <div className="cell-sub">{r.riferimento}</div>}
                  </td>
                  <td className="cell-scad">
                    {!r.avviso && !r.illimitato && <div>{fmtData(r.data_scadenza)}</div>}
                    <div style={{ color: "var(--dim)", fontSize: "11px" }}>{testoScadenza(r)}</div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`pill pill--${PILL[r._stato]}`}><span className="pill__dot" />{LABEL[r._stato]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sit && (
        <div className="modale-bg" onMouseDown={(e)=>e.target===e.currentTarget&&setSit(null)}>
          <div className="modale" style={{maxWidth:640}}>
            <h2>Situazione · {sit.nome}</h2>
            {sit.righe === null ? <p className="muted">Caricamento…</p>
            : sit.righe.length === 0 ? <p className="muted">Nessun corso o visita registrati.</p>
            : (
              <div className="tabella-wrap"><table className="scad">
                <thead><tr><th>Voce</th><th>Data</th><th style={{textAlign:"right"}}>Scadenza</th></tr></thead>
                <tbody>
                  {sit.righe.map((x,i)=>{ const p=pillSit(x.data_scadenza); return (
                    <tr key={i} style={x.avviso?{background:"#fdecec"}:undefined}>
                      <td><div className="cell-corso"><span className="nav__soon" style={{marginRight:6}}>{x.ambito==="corso"?"Corso":"Visita"}</span>
                        {x.avviso ? <span style={{color:"var(--scaduto)",fontWeight:700}}>{x.descrizione}</span> : x.descrizione}</div>
                        {x.riferimento && <div className="cell-sub">{x.riferimento}</div>}</td>
                      <td className="cell-corso">{fmtData(x.data_evento)}</td>
                      <td className="cell-scad">
                        {x.avviso ? <span className="pill pill--scaduto"><span className="pill__dot" />urgente da fare!</span>
                         : x.data_scadenza ? <span className={`pill pill--${p.k}`}><span className="pill__dot" />{p.label}</span>
                         : <span className="cell-sub">illimitata</span>}
                        {x.data_scadenza && <div className="cell-sub" style={{textAlign:"right"}}>{fmtData(x.data_scadenza)}</div>}
                      </td>
                    </tr> ); })}
                </tbody>
              </table></div>
            )}
            <div className="modale-azioni"><button className="chip" onClick={()=>setSit(null)}>Chiudi</button></div>
          </div>
        </div>
      )}
    </>
  );
}