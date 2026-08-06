"use client";

import { useState, useMemo } from "react";

// Soglia FISSA di prodotto: in scadenza entro 90 giorni. Un solo punto.
const SOGLIA_SCADENZA_GG = 90;

const OGGI = new Date();

function giorniA(dataStr) {
  if (!dataStr) return null;
  return Math.round((new Date(dataStr) - OGGI) / 86400000);
}

function statoDi(riga) {
  if (riga.senza_corsi) return "senza";
  if (riga.illimitato) return "illim";
  const g = giorniA(riga.data_scadenza);
  if (g === null) return "illim";
  if (g < 0) return "scaduto";
  if (g <= SOGLIA_SCADENZA_GG) return "imminente";
  return "ok";
}

function fmtData(dataStr) {
  if (!dataStr) return "—";
  return new Date(dataStr).toLocaleDateString("it-IT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function testoScadenza(riga) {
  if (riga.illimitato) return "illimitata";
  if (riga.senza_corsi) return "—";
  const g = giorniA(riga.data_scadenza);
  if (g === null) return "—";
  if (g < 0) return `${Math.abs(g)} gg fa`;
  if (g === 0) return "oggi";
  return `tra ${g} gg`;
}

const LABEL = {
  scaduto: "Scaduto",
  imminente: "In scadenza",
  ok: "Valido",
  illim: "Illimitato",
  senza: "Nessun corso",
};

export default function Scadenzario({ righe }) {
  const [filtro, setFiltro] = useState("tutti");
  const [q, setQ] = useState("");

  const conStato = useMemo(
    () => righe.map((r) => ({ ...r, _stato: statoDi(r) })),
    [righe]
  );

  const conteggi = useMemo(() => {
    const c = { scaduto: 0, imminente: 0, ok: 0, illim: 0, senza: 0 };
    conStato.forEach((r) => { c[r._stato] = (c[r._stato] || 0) + 1; });
    return c;
  }, [conStato]);

  const visibili = useMemo(() => {
    const query = q.trim().toLowerCase();
    return conStato
      .filter((r) => {
        if (filtro === "scaduti" && r._stato !== "scaduto") return false;
        if (filtro === "scadenza" && r._stato !== "imminente") return false;
        if (filtro === "validi" && !["ok", "illim"].includes(r._stato)) return false;
        if (filtro === "senza" && r._stato !== "senza") return false;
        if (query) {
          const blob = `${r.cognome} ${r.nome} ${r.tipologia || ""} ${r.azienda || ""} ${r.mansione || ""}`.toLowerCase();
          if (!blob.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // scaduti in cima, poi per giorni mancanti crescenti
        const ordine = { scaduto: 0, imminente: 1, senza: 2, ok: 3, illim: 4 };
        if (ordine[a._stato] !== ordine[b._stato]) return ordine[a._stato] - ordine[b._stato];
        const ga = giorniA(a.data_scadenza) ?? 99999;
        const gb = giorniA(b.data_scadenza) ?? 99999;
        return ga - gb;
      });
  }, [conStato, filtro, q]);

  const senzaCorsi = conteggi.senza;

  return (
    <>
      <div className="riepilogo">
        <div className="kpi kpi--scaduto">
          <div className="kpi__num">{conteggi.scaduto}</div>
          <div className="kpi__label">Scaduti</div>
        </div>
        <div className="kpi kpi--imminente">
          <div className="kpi__num">{conteggi.imminente}</div>
          <div className="kpi__label">In scadenza entro {SOGLIA_SCADENZA_GG} giorni</div>
        </div>
        <div className="kpi kpi--ok">
          <div className="kpi__num">{conteggi.ok + conteggi.illim}</div>
          <div className="kpi__label">In regola</div>
        </div>
      </div>

      {senzaCorsi > 0 && (
        <div className="avviso">
          <div className="avviso__titolo">
            {senzaCorsi} {senzaCorsi === 1 ? "lavoratore" : "lavoratori"} senza alcun corso registrato
          </div>
          <div className="avviso__sub">
            La formazione generale (art. 37 D.Lgs. 81/08) è obbligatoria per tutti i lavoratori.
          </div>
        </div>
      )}

      <div className="filtri">
        {[
          ["tutti", "Tutti"],
          ["scaduti", "Scaduti"],
          ["scadenza", "In scadenza"],
          ["validi", "Validi"],
          ["senza", "Senza corsi"],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`chip ${filtro === k ? "chip--on" : ""}`}
            onClick={() => setFiltro(k)}
          >
            {label}
          </button>
        ))}
        <input
          className="search"
          placeholder="Cerca per nome, corso, azienda…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {visibili.length === 0 ? (
        <div className="vuoto">
          <h3>Nessun risultato</h3>
          <p>Nessuna riga corrisponde ai filtri attivi.</p>
        </div>
      ) : (
        <div className="tabella-wrap">
          <table className="scad">
            <thead>
              <tr>
                <th>Lavoratore</th>
                <th className="cell-hide-sm">Azienda</th>
                <th>Corso</th>
                <th style={{ textAlign: "right" }}>Scadenza</th>
                <th style={{ textAlign: "right" }}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {visibili.map((r, i) => (
                <tr key={`${r.iscrizione_id ?? "nc"}-${r.lavoratore_id}-${i}`}>
                  <td>
                    <div className="cell-nome">
                      {r.cognome} {r.nome}
                    </div>
                    {r.mansione && <div className="cell-sub">{r.mansione}</div>}
                  </td>
                  <td className="cell-hide-sm">
                    <span className="cell-azienda">{r.azienda || "Privatista"}</span>
                  </td>
                  <td>
                    {r.senza_corsi ? (
                      <span className="cell-corso" style={{ color: "var(--scaduto)" }}>
                        Nessun corso
                      </span>
                    ) : (
                      <>
                        <div className="cell-corso">{r.tipologia}</div>
                        {r.tipologia_aggiornamento &&
                          r.tipologia_aggiornamento !== r.tipologia && (
                            <div className="cell-agg">
                              → {r.tipologia_aggiornamento}
                            </div>
                          )}
                      </>
                    )}
                  </td>
                  <td className="cell-scad">
                    {!r.senza_corsi && !r.illimitato && (
                      <div>{fmtData(r.data_scadenza)}</div>
                    )}
                    <div style={{ color: "var(--dim)", fontSize: "11px" }}>
                      {testoScadenza(r)}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`pill pill--${r._stato === "senza" ? "scaduto" : r._stato}`}>
                      <span className="pill__dot" />
                      {LABEL[r._stato]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
