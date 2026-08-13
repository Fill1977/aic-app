"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// I codici devono combaciare con i fattori del seed (20_seed_adempimenti.sql).
const FATTORI = [
  { gruppo: "Dimensione / organizzazione", items: [
    ["appalti","Appalti / interferenze"],["cantieri","Cantieri"],
    ["scuola_lavoro","Tirocinanti / PCTO"],["sorveglianza_sanitaria","Sorveglianza sanitaria"]] },
  { gruppo: "Agenti fisici", items: [
    ["rumore","Rumore"],["vibrazioni","Vibrazioni"],["microclima_calore","Microclima / calore"],
    ["roa","Radiazioni ottiche"],["cem","Campi elettromagnetici"],["radiazioni_ionizzanti","Radiazioni ionizzanti"]] },
  { gruppo: "Agenti chimici / biologici", items: [
    ["agenti_chimici","Agenti chimici"],["cancerogeni_mutageni","Cancerogeni / mutageni"],
    ["agenti_biologici","Agenti biologici"],["amianto","Amianto"],["atex","ATEX"],["rischio_legionella","Legionella"]] },
  { gruppo: "Ergonomia", items: [
    ["mmc","Movimentazione manuale carichi"],["videoterminali","Videoterminali"]] },
  { gruppo: "Attività particolari", items: [
    ["lavori_in_quota","Lavori in quota"],["spazi_confinati","Spazi confinati"],
    ["mansioni_a_rischio_alcol_droghe","Mansioni a rischio alcol/droghe"]] },
  { gruppo: "Impianti / attrezzature", items: [
    ["impianti_elettrici","Impianti elettrici / terra"],["scariche_atmosferiche","Scariche atmosferiche"],
    ["attrezzature_sollevamento","Attrezzature di sollevamento"],["attrezzature_pressione","Attrezzature a pressione"],
    ["ascensori","Ascensori"]] },
  { gruppo: "Antincendio", items: [
    ["mezzi_antincendio","Estintori"],["impianti_antincendio","Impianti antincendio"],
    ["attivita_soggette_cpi","Attività soggetta a CPI"]] },
];
const SOGLIA = 90;
const fmt = (d) => d ? new Date(d).toLocaleDateString("it-IT") : "—";

function statoDi(r) {
  if (!r.ha_istanza) return { k: "dafare", label: "da fare", ord: 0 };
  if (!r.data_scadenza) return { k: "ok", label: "adempiuto", ord: 4 };
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const g = Math.round((new Date(r.data_scadenza) - oggi) / 86400000);
  if (g < 0) return { k: "scaduto", label: `scaduto da ${-g}g`, ord: 1 };
  if (g <= SOGLIA) return { k: "imminente", label: `tra ${g}g`, ord: 2 };
  return { k: "ok", label: "valido", ord: 3 };
}
const vuotaForm = { id: null, tipo_id: null, titolo: "", periodicita_mesi: "",
  data_esecuzione: "", esito: "", tecnico: "", numero_verbale: "", note: "" };

export default function AdempimentiView({ sedi, catalogo, slug }) {
  const [supabase] = useState(() => supabaseBrowser());
  const [sedeId, setSedeId] = useState(sedi.length === 1 ? String(sedi[0].id) : "");
  const [profilo, setProfilo] = useState(new Set());
  const [profiloDirty, setProfiloDirty] = useState(false);
  const [applicabili, setApplicabili] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profiloOpen, setProfiloOpen] = useState(false);
  const [aggiungi, setAggiungi] = useState(false);

  const [fStato, setFStato] = useState("tutti");
  const [fCat, setFCat] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [q, setQ] = useState("");
  const [ordina, setOrdina] = useState("categoria");

  const [modale, setModale] = useState(false);
  const [form, setForm] = useState(vuotaForm);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState("");
  const [storico, setStorico] = useState(null); // {titolo, righe[]}

  const reload = useCallback(async (sid) => {
    if (!sid) { setApplicabili([]); setProfilo(new Set()); return; }
    setLoading(true);
    const [{ data: fatt }, { data: app }] = await Promise.all([
      supabase.rpc("fattori_sede_slug", { p_slug: slug, p_sede_id: Number(sid) }),
      supabase.rpc("adempimenti_applicabili_slug", { p_slug: slug, p_sede_id: Number(sid) }),
    ]);
    setProfilo(new Set(fatt || []));
    setProfiloDirty(false);
    setApplicabili(app || []);
    setLoading(false);
  }, [supabase, slug]);

  useEffect(() => { reload(sedeId); }, [sedeId, reload]);

  const righe = useMemo(() => applicabili.map((r) => ({ ...r, stato: statoDi(r) })), [applicabili]);
  const kpi = useMemo(() => {
    const c = { dafare: 0, scaduto: 0, imminente: 0, ok: 0 };
    righe.forEach((r) => { c[r.stato.k]++; });
    return c;
  }, [righe]);

  const categorie = useMemo(() => [...new Set(righe.map((r) => r.categoria))], [righe]);
  const tipi = useMemo(() => [...new Set(righe.map((r) => r.tipo_obbligo))], [righe]);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = righe.filter((r) => {
      if (fStato !== "tutti" && r.stato.k !== fStato) return false;
      if (fCat && r.categoria !== fCat) return false;
      if (fTipo && r.tipo_obbligo !== fTipo) return false;
      if (t && !`${r.titolo} ${r.riferimento || ""} ${r.codice}`.toLowerCase().includes(t)) return false;
      return true;
    });
    if (ordina === "scadenza") {
      const key = (r) => !r.ha_istanza ? -Infinity
        : r.data_scadenza ? new Date(r.data_scadenza).getTime() : Infinity;
      out = [...out].sort((a, b) => key(a) - key(b));
    } else {
      out = [...out].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.codice.localeCompare(b.codice));
    }
    return out;
  }, [righe, fStato, fCat, fTipo, q, ordina]);

  const opzionali = useMemo(() => {
    const attivi = new Set(applicabili.map((r) => r.tipo_id));
    return catalogo.filter((c) => !attivi.has(c.id));
  }, [catalogo, applicabili]);

  function toggleFattore(code) {
    setProfilo((p) => { const n = new Set(p); n.has(code) ? n.delete(code) : n.add(code); return n; });
    setProfiloDirty(true);
  }
  async function salvaProfilo() {
    const { error } = await supabase.rpc("salva_profilo_sede_slug", { p_slug: slug, p_sede_id: Number(sedeId), p_fattori: [...profilo] });
    if (error) { alert(error.message); return; }
    await reload(sedeId);
  }

  function apriRegistra(r, edit) {
    setErrore("");
    if (edit && r.ha_istanza) setForm({
      id: r.ultima_id, tipo_id: r.tipo_id, titolo: r.titolo,
      periodicita_mesi: r.periodicita_mesi ?? "", data_esecuzione: r.ultima_esecuzione || "",
      esito: r.esito || "", tecnico: "", numero_verbale: "", note: "" });
    else setForm({ ...vuotaForm, tipo_id: r.tipo_id, titolo: r.titolo, periodicita_mesi: r.periodicita_mesi ?? "" });
    setModale(true);
  }
  async function salvaIstanza() {
    if (!form.data_esecuzione) { setErrore("La data di esecuzione è obbligatoria."); return; }
    setSalvando(true); setErrore("");
    const { error } = await supabase.rpc("salva_adempimento_slug", {
      p_slug: slug, p_id: form.id, p_sede_id: Number(sedeId), p_tipo_id: form.tipo_id,
      p_data_esecuzione: form.data_esecuzione,
      p_periodicita_mesi: form.periodicita_mesi === "" ? null : Number(form.periodicita_mesi),
      p_esito: form.esito || null, p_tecnico: form.tecnico || null,
      p_numero_verbale: form.numero_verbale || null, p_note: form.note || null,
      p_categoria: null, p_descrizione: null });
    setSalvando(false);
    if (error) { setErrore(error.message); return; }
    setModale(false); await reload(sedeId);
  }
  async function eliminaUltima(r) {
    if (!r.ultima_id || !confirm("Eliminare l'ultima esecuzione registrata?")) return;
    await supabase.rpc("elimina_adempimento_slug", { p_slug: slug, p_id: r.ultima_id });
    await reload(sedeId);
  }
  async function escludi(r) {
    if (!confirm(`Segnare "${r.titolo}" come non applicabile a questa sede?`)) return;
    await supabase.rpc("imposta_applicabilita_slug", { p_slug: slug, p_sede_id: Number(sedeId), p_tipo_id: r.tipo_id, p_applicabile: false });
    await reload(sedeId);
  }
  async function includi(tipoId) {
    await supabase.rpc("imposta_applicabilita_slug", { p_slug: slug, p_sede_id: Number(sedeId), p_tipo_id: tipoId, p_applicabile: true });
    setAggiungi(false); await reload(sedeId);
  }
  async function apriStorico(r) {
    const { data } = await supabase.rpc("storico_adempimento_slug", { p_slug: slug, p_sede_id: Number(sedeId), p_tipo_id: r.tipo_id });
    setStorico({ titolo: r.titolo, tipo_id: r.tipo_id, righe: data || [] });
  }
  async function eliminaDaStorico(id, tipoId) {
    if (!confirm("Eliminare questa esecuzione?")) return;
    await supabase.rpc("elimina_adempimento_slug", { p_slug: slug, p_id: id });
    const { data } = await supabase.rpc("storico_adempimento_slug", { p_slug: slug, p_sede_id: Number(sedeId), p_tipo_id: tipoId });
    setStorico((s) => ({ ...s, righe: data || [] }));
    await reload(sedeId);
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const sediRaggr = useMemo(() => {
    const m = new Map();
    sedi.forEach((s) => { const a = s.azienda || "—"; if (!m.has(a)) m.set(a, []); m.get(a).push(s); });
    return [...m.entries()];
  }, [sedi]);

  const btn = { padding: "4px 10px", borderRadius: 7, border: "1px solid var(--bordo,#d7dee6)", background: "#fff", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" };

  return (
    <>
      <div className="filtri">
        <select className="search" value={sedeId} onChange={(e) => setSedeId(e.target.value)} style={{ maxWidth: 340 }}>
          <option value="">— seleziona una sede —</option>
          {sediRaggr.map(([az, ss]) => (
            <optgroup key={az} label={az}>
              {ss.map((s) => <option key={s.id} value={s.id}>{s.nome}{s.legale ? " (legale)" : ""}</option>)}
            </optgroup>
          ))}
        </select>
        {sedeId && <button className="chip" onClick={() => setProfiloOpen((v) => !v)}>
          {profiloOpen ? "Nascondi profilo" : "Profilo di rischio"} {profilo.size > 0 ? `· ${profilo.size}` : ""}
        </button>}
      </div>

      {!sedeId ? (
        <div className="vuoto"><h3>Scegli una sede</h3><p>Gli adempimenti sono legati alla sede. Selezionane una per vedere cosa si applica.</p></div>
      ) : (
        <>
          {profiloOpen && (
            <div className="modale" style={{ position: "static", maxWidth: "none", marginBottom: 18 }}>
              <h2>Profilo di rischio della sede</h2>
              <p className="muted" style={{ marginTop: -6 }}>Accendi ciò che è presente: gli adempimenti applicabili si aggiornano di conseguenza.</p>
              {FATTORI.map((g) => (
                <div key={g.gruppo} style={{ marginBottom: 12 }}>
                  <div className="cell-sub" style={{ marginBottom: 6, fontWeight: 600 }}>{g.gruppo}</div>
                  <div className="filtri" style={{ gap: 8 }}>
                    {g.items.map(([code, label]) => (
                      <button key={code} className={`chip ${profilo.has(code) ? "chip--on" : ""}`} onClick={() => toggleFattore(code)}>{label}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="modale-azioni">
                <button className="chip" onClick={() => reload(sedeId)}>Annulla</button>
                <button className="chip chip--on" disabled={!profiloDirty} onClick={salvaProfilo}>Salva profilo</button>
              </div>
            </div>
          )}

          <div className="riepilogo">
            <div className="kpi"><div className="kpi__num">{kpi.dafare}</div><div className="kpi__label">Da fare</div></div>
            <div className="kpi kpi--scaduto"><div className="kpi__num">{kpi.scaduto}</div><div className="kpi__label">Scaduti</div></div>
            <div className="kpi kpi--imminente"><div className="kpi__num">{kpi.imminente}</div><div className="kpi__label">In scadenza</div></div>
            <div className="kpi kpi--ok"><div className="kpi__num">{kpi.ok}</div><div className="kpi__label">In regola</div></div>
          </div>

          <div className="filtri">
            {["tutti","dafare","scaduto","imminente","ok"].map((f) => (
              <button key={f} className={`chip ${fStato === f ? "chip--on" : ""}`} onClick={() => setFStato(f)}>
                {f === "tutti" ? "Tutti" : f === "dafare" ? "Da fare" : f === "scaduto" ? "Scaduti" : f === "imminente" ? "In scadenza" : "In regola"}
              </button>
            ))}
          </div>

          <div className="filtri">
            <select className="search" value={fCat} onChange={(e) => setFCat(e.target.value)} style={{ maxWidth: 230 }}>
              <option value="">Tutte le categorie</option>
              {categorie.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="search" value={fTipo} onChange={(e) => setFTipo(e.target.value)} style={{ maxWidth: 190 }}>
              <option value="">Tutti i tipi</option>
              {tipi.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="search" value={ordina} onChange={(e) => setOrdina(e.target.value)} style={{ maxWidth: 190 }}>
              <option value="categoria">Ordina: categoria</option>
              <option value="scadenza">Ordina: scadenza</option>
            </select>
            <input className="search" placeholder="Cerca…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 200 }} />
            <button className="chip" onClick={() => setAggiungi((v) => !v)}><span className="plus">＋</span>&nbsp;Aggiungi</button>
          </div>

          {aggiungi && (
            <div className="modale" style={{ position: "static", maxWidth: "none", marginBottom: 18 }}>
              <h2>Aggiungi un adempimento non proposto</h2>
              {opzionali.length === 0 ? <p className="muted">Tutti gli adempimenti del catalogo sono già in elenco.</p> : (
                <div className="tabella-wrap"><table className="scad"><tbody>
                  {opzionali.map((c) => (
                    <tr key={c.id}>
                      <td><div className="cell-nome">{c.titolo}</div><div className="cell-sub">{c.categoria} · {c.riferimento || ""}</div></td>
                      <td className="cell-scad" style={{ textAlign: "right" }}><button className="chip chip--on" onClick={() => includi(c.id)}>Includi</button></td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </div>
          )}

          {loading ? <div className="vuoto"><p>Caricamento…</p></div>
          : lista.length === 0 ? <div className="vuoto"><h3>Nessun adempimento</h3><p>Nessuna voce per questi filtri.</p></div>
          : (
            <div className="tabella-wrap">
              <table className="scad">
                <thead><tr>
                  <th>Adempimento</th>
                  <th className="cell-hide-sm">Categoria</th>
                  <th className="cell-hide-sm">Ultima</th>
                  <th>Stato</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {lista.map((r) => (
                    <tr key={r.tipo_id}>
                      <td>
                        <div className="cell-nome">{r.titolo}{r.origine === "incluso" && <span className="nav__soon" style={{ marginLeft: 6 }}>aggiunto</span>}</div>
                        <div className="cell-sub">{r.riferimento} · {r.tipo_obbligo}{r.periodicita_mesi ? ` · ogni ${r.periodicita_mesi} mesi` : ""}</div>
                      </td>
                      <td className="cell-hide-sm cell-corso">{r.categoria}</td>
                      <td className="cell-hide-sm cell-corso">{fmt(r.ultima_esecuzione)}</td>
                      <td className="cell-scad">
                        <span className={`pill pill--${r.stato.k}`}><span className="pill__dot" />{r.stato.label}</span>
                        {r.data_scadenza && <div className="cell-sub" style={{ textAlign: "right" }}>scad. {fmt(r.data_scadenza)}</div>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
                          <button className="chip chip--on" onClick={() => apriRegistra(r, false)}>{r.ha_istanza ? "Nuova esec." : "Registra"}</button>
                          {r.ha_istanza && <button style={btn} onClick={() => apriRegistra(r, true)}>Modifica</button>}
                          {r.ha_istanza && <button style={{ ...btn, color: "#b00020" }} onClick={() => eliminaUltima(r)}>Elimina</button>}
                          {r.ha_istanza && <button style={btn} onClick={() => apriStorico(r)}>Storico</button>}
                          <button style={{ ...btn, color: "#6b7683" }} onClick={() => escludi(r)} title="Segna come non applicabile a questa sede">Escludi</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {storico && (
        <div className="modale-bg" onMouseDown={(e) => e.target === e.currentTarget && setStorico(null)}>
          <div className="modale">
            <h2>Storico esecuzioni</h2>
            <p className="muted" style={{ marginTop: -6 }}>{storico.titolo}</p>
            {storico.righe.length === 0 ? <p className="muted">Nessuna esecuzione registrata.</p> : (
              <div className="tabella-wrap"><table className="scad">
                <thead><tr><th>Data</th><th>Esito</th><th className="cell-hide-sm">Tecnico</th><th className="cell-hide-sm">N. verbale</th><th></th></tr></thead>
                <tbody>
                  {storico.righe.map((h, i) => (
                    <tr key={h.id} style={i > 0 ? { opacity: 0.6 } : undefined}>
                      <td className="cell-corso">{fmt(h.data_esecuzione)}{i === 0 && <span className="nav__soon" style={{ marginLeft: 6 }}>attuale</span>}</td>
                      <td className="cell-corso">{h.esito || "—"}</td>
                      <td className="cell-hide-sm cell-corso">{h.tecnico || "—"}</td>
                      <td className="cell-hide-sm cell-corso">{h.numero_verbale || "—"}</td>
                      <td className="cell-scad"><button style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #d7dee6", background: "#fff", color: "#b00020", fontSize: 13, cursor: "pointer" }}
                        onClick={() => eliminaDaStorico(h.id, storico.tipo_id)}>Elimina</button></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
            <div className="modale-azioni"><button className="chip" onClick={() => setStorico(null)}>Chiudi</button></div>
          </div>
        </div>
      )}

      {modale && (
        <div className="modale-bg" onMouseDown={(e) => e.target === e.currentTarget && setModale(false)}>
          <div className="modale">
            <h2>{form.id ? "Modifica esecuzione" : "Registra esecuzione"}</h2>
            <p className="muted" style={{ marginTop: -6 }}>{form.titolo}</p>
            {errore && <div className="auth__msg auth__msg--err">{errore}</div>}
            <div className="modale-grid">
              <div className="field">
                <label>Data esecuzione</label>
                <input type="date" value={form.data_esecuzione} onChange={set("data_esecuzione")} />
              </div>
              <div className="field">
                <label>Periodicità (mesi)</label>
                <input type="number" min="0" placeholder="default catalogo" value={form.periodicita_mesi} onChange={set("periodicita_mesi")} />
              </div>
              <div className="field">
                <label>Esito</label>
                <input value={form.esito} onChange={set("esito")} placeholder="es. conforme / regolare" />
              </div>
              <div className="field">
                <label>Tecnico / organismo</label>
                <input value={form.tecnico} onChange={set("tecnico")} />
              </div>
              <div className="field">
                <label>N. verbale / documento</label>
                <input value={form.numero_verbale} onChange={set("numero_verbale")} />
              </div>
              <div className="field field--full">
                <label>Note</label>
                <input value={form.note} onChange={set("note")} />
              </div>
            </div>
            <div className="modale-azioni">
              <button className="chip" onClick={() => setModale(false)}>Annulla</button>
              <button className="chip chip--on" disabled={salvando} onClick={salvaIstanza}>{salvando ? "Salvataggio…" : "Salva"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
