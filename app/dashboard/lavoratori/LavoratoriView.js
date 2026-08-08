"use client";
import { useState } from "react";
import { salvaLavoratore, disattivaLavoratore } from "./actions";
import { validaCF } from "@/lib/cf";

const VUOTO = {
  id: null, sede_id: "", nome: "", cognome: "", cod_fisc: "", email: "",
  mansione: "", centro_di_costo: "",
  soggetto_sorveglianza_sanitaria: false,
};

export default function LavoratoriView({ lavoratori, sedi, slug, tipoOrg }) {
  const [modale, setModale] = useState(null);
  const [q, setQ] = useState("");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);
  const [errCF, setErrCF] = useState("");
  const labelCli = tipoOrg === "studio" ? "Azienda / Sede" : "Sede";

  const filtrati = lavoratori.filter((l) => {
    if (!q.trim()) return true;
    const b = `${l.cognome} ${l.nome} ${l.mansione||""} ${l.azienda||""} ${l.sede||""} ${l.cod_fisc||""}`.toLowerCase();
    return b.includes(q.toLowerCase());
  });

  function apri(l) {
    setErrore(""); setErrCF("");
    if (!l) { setModale({ ...VUOTO }); return; }
    const p = { ...VUOTO };
    for (const k in VUOTO) p[k] = l[k] ?? (typeof VUOTO[k]==="boolean"?false:"");
    p.id = l.id; p.sede_id = l.sede_id ?? "";
    setModale(p);
  }

  async function salva() {
    setErrore("");
    if (!modale.cognome.trim()) { setErrore("Il cognome è obbligatorio."); return; }
    const vcf = validaCF(modale.cod_fisc, modale.cognome, modale.nome);
    if (!vcf.ok) { setErrCF(vcf.msg); return; }
    setInvio(true);
    const res = await salvaLavoratore(slug, modale);
    setInvio(false);
    if (res.errore) { setErrore(res.errore); return; }
    window.location.reload();
  }

  async function disattiva(l) {
    if (!confirm(`Cessare "${l.cognome} ${l.nome||""}"?`)) return;
    const res = await disattivaLavoratore(slug, l.id);
    if (res.errore) { alert(res.errore); return; }
    window.location.reload();
  }

  // etichetta sede nel menu: "Azienda — Sede" (o solo sede per aziende dirette)
  function labelSede(s) {
    return tipoOrg === "studio" ? `${s.azienda} — ${s.nome}` : s.nome;
  }

  return (
    <>
      <div className="filtri">
        <input className="search" placeholder="Cerca nome, mansione, sede…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="chip chip--on" style={{cursor:"pointer"}} onClick={()=>apri(null)}>+ Nuovo lavoratore</button>
      </div>

      {filtrati.length===0 ? (
        <div className="vuoto"><h3>Nessun lavoratore</h3><p>Aggiungi il primo con il pulsante qui sopra.</p></div>
      ) : (
        <div className="tabella-wrap">
          <table className="scad">
            <thead><tr>
              <th>Lavoratore</th><th className="cell-hide-sm">{labelCli}</th>
              <th className="cell-hide-sm">Mansione</th>
              <th style={{textAlign:"center"}}>Sorv. san.</th>
              <th style={{textAlign:"right"}}>Azioni</th>
            </tr></thead>
            <tbody>
              {filtrati.map((l)=>(
                <tr key={l.id}>
                  <td><div className="cell-nome">{l.cognome} {l.nome}</div>
                    {l.cod_fisc && <div className="cell-sub">{l.cod_fisc}</div>}</td>
                  <td className="cell-hide-sm"><span className="cell-azienda">
                    {l.sede ? (tipoOrg==="studio" ? `${l.azienda||""} — ${l.sede}` : l.sede) : "Privatista"}
                  </span></td>
                  <td className="cell-hide-sm"><span className="cell-azienda">{l.mansione||"—"}</span></td>
                  <td style={{textAlign:"center"}}>
                    {l.soggetto_sorveglianza_sanitaria
                      ? <span className="pill pill--ok"><span className="pill__dot"/>Sì</span>
                      : <span style={{color:"var(--dim)"}}>—</span>}</td>
                  <td style={{textAlign:"right",whiteSpace:"nowrap"}}>
                    <button className="chip" style={{cursor:"pointer"}} onClick={()=>apri(l)}>Modifica</button>
                    <button className="chip" style={{cursor:"pointer",marginLeft:6}} onClick={()=>disattiva(l)}>Cessa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modale && (
        <div className="modale-bg" onClick={(e)=>e.target===e.currentTarget&&setModale(null)}>
          <div className="modale">
            <h2>{modale.id?"Modifica":"Nuovo"} lavoratore</h2>
            {errore && <div className="auth__msg auth__msg--err">{errore}</div>}
            <div className="modale-grid">
              <div className="field"><label>Cognome *</label>
                <input value={modale.cognome} onChange={(e)=>setModale({...modale,cognome:e.target.value})} /></div>
              <div className="field"><label>Nome</label>
                <input value={modale.nome} onChange={(e)=>setModale({...modale,nome:e.target.value})} /></div>
              <div className="field field--full"><label>{labelCli}</label>
                <select value={modale.sede_id} onChange={(e)=>setModale({...modale,sede_id:e.target.value})}>
                  <option value="">— Privatista (nessuna sede) —</option>
                  {sedi.map((s)=>(<option key={s.id} value={s.id}>{labelSede(s)}</option>))}
                </select></div>
              <div className="field"><label>Codice fiscale</label>
                <input value={modale.cod_fisc}
                  onChange={(e)=>{ setErrCF(""); setModale({...modale,cod_fisc:e.target.value.toUpperCase()}); }}
                  onBlur={()=>{ const v=validaCF(modale.cod_fisc,modale.cognome,modale.nome); setErrCF(v.ok?"":v.msg); }}
                  maxLength={16} style={errCF?{borderColor:"var(--scaduto)"}:undefined} />
                {errCF && <span className="field__hint field__hint--no">{errCF}</span>}</div>
              <div className="field"><label>Email</label>
                <input value={modale.email} onChange={(e)=>setModale({...modale,email:e.target.value})} /></div>
              <div className="field"><label>Mansione</label>
                <input value={modale.mansione} onChange={(e)=>setModale({...modale,mansione:e.target.value})} /></div>
              <div className="field"><label>Reparto</label>
                <input value={modale.centro_di_costo} onChange={(e)=>setModale({...modale,centro_di_costo:e.target.value})} /></div>
              <div className="field field--full" style={{flexDirection:"row",alignItems:"center",gap:10}}>
                <input type="checkbox" id="ss" checked={modale.soggetto_sorveglianza_sanitaria}
                  onChange={(e)=>setModale({...modale,soggetto_sorveglianza_sanitaria:e.target.checked})}
                  style={{width:18,height:18,accentColor:"var(--blu)"}} />
                <label htmlFor="ss" style={{letterSpacing:0,textTransform:"none",fontSize:14,color:"var(--text)"}}>
                  Soggetto a sorveglianza sanitaria</label>
              </div>
            </div>
            <div className="modale-azioni">
              <button className="chip" style={{cursor:"pointer"}} onClick={()=>setModale(null)}>Annulla</button>
              <button className="btn" style={{width:"auto",padding:"10px 22px",margin:0}} onClick={salva} disabled={invio}>
                {invio?"Salvataggio…":"Salva"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
