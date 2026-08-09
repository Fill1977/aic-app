"use client";
import { useState } from "react";
import { salvaCorso, eliminaCorso, iscrivi, disiscrivi, caricaIscritti } from "./actions";

const VUOTO = { id:null, id_tipologia:"", cod_corso:"", docente:"", societa:"", sede:"", data_fine_corso:"", note:"" };

function fmtData(d){ if(!d) return "—"; return new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}); }

export default function CorsiView({ corsi, tipologie, periodicita, lavoratori, slug, tipoOrg }) {
  const [modale, setModale] = useState(null);       // form corso
  const [pannello, setPannello] = useState(null);   // {corso, iscritti} gestione iscritti
  const [q, setQ] = useState("");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);

  const filtrati = corsi.filter((c) => {
    if (!q.trim()) return true;
    return `${c.tipologia} ${c.docente||""} ${c.cod_corso||""} ${c.sede||""}`.toLowerCase().includes(q.toLowerCase());
  });

  function apri(c) {
    setErrore("");
    if (!c) { setModale({ ...VUOTO }); return; }
    const p = { ...VUOTO };
    for (const k in VUOTO) p[k] = c[k] ?? "";
    p.id = c.id;
    setModale(p);
  }

  async function salva() {
    setErrore("");
    if (!modale.id_tipologia) { setErrore("Seleziona la tipologia di corso."); return; }
    setInvio(true);
    const res = await salvaCorso(slug, modale);
    setInvio(false);
    if (res.errore) { setErrore(res.errore); return; }
    window.location.reload();
  }

  async function elimina(c) {
    if (!confirm(`Eliminare il corso "${c.tipologia}" del ${fmtData(c.data_fine_corso)}?`)) return;
    const res = await eliminaCorso(slug, c.id);
    if (res.errore) { alert(res.errore); return; }
    window.location.reload();
  }

  // --- gestione iscritti ---
  async function apriIscritti(corso) {
    const res = await caricaIscritti(slug, corso.id);
    setPannello({ corso, iscritti: res.iscritti });
  }
  async function aggiungiIscritto(lavId) {
    const res = await iscrivi(slug, pannello.corso.id, lavId);
    if (res.errore) { alert(res.errore); return; }
    const r = await caricaIscritti(slug, pannello.corso.id);
    setPannello({ ...pannello, iscritti: r.iscritti });
  }
  async function togliIscritto(iscId) {
    const res = await disiscrivi(slug, iscId);
    if (res.errore) { alert(res.errore); return; }
    const r = await caricaIscritti(slug, pannello.corso.id);
    setPannello({ ...pannello, iscritti: r.iscritti });
  }

  const idIscritti = new Set((pannello?.iscritti||[]).map((i)=>i.lavoratore_id));
  const disponibili = lavoratori.filter((l)=>!idIscritti.has(l.id));


  return (
    <>
      <div className="filtri">
        <input className="search" placeholder="Cerca corso, docente, sede…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="chip chip--on" style={{cursor:"pointer"}} onClick={()=>apri(null)}>+ Nuovo corso</button>
      </div>

      {filtrati.length===0 ? (
        <div className="vuoto"><h3>Nessun corso</h3><p>Crea la prima edizione con il pulsante qui sopra.</p></div>
      ) : (
        <div className="tabella-wrap">
          <table className="scad">
            <thead><tr>
              <th>Corso</th><th className="cell-hide-sm">Docente</th>
              <th style={{textAlign:"center"}}>Data fine</th>
              <th style={{textAlign:"center"}}>Iscritti</th>
              <th style={{textAlign:"right"}}>Azioni</th>
            </tr></thead>
            <tbody>
              {filtrati.map((c)=>(
                <tr key={c.id}>
                  <td><div className="cell-nome">{c.tipologia}</div>
                    {c.cod_corso && <div className="cell-sub">{c.cod_corso}</div>}</td>
                  <td className="cell-hide-sm"><span className="cell-azienda">{c.docente||"—"}</span></td>
                  <td style={{textAlign:"center"}}><span className="cell-azienda">{fmtData(c.data_fine_corso)}</span></td>
                  <td style={{textAlign:"center"}}>
                    <button className="chip" style={{cursor:"pointer"}} onClick={()=>apriIscritti(c)}>
                      {c.n_iscritti} iscritti
                    </button>
                  </td>
                  <td style={{textAlign:"right",whiteSpace:"nowrap"}}>
                    <button className="chip" style={{cursor:"pointer"}} onClick={()=>apri(c)}>Modifica</button>
                    <button className="chip" style={{cursor:"pointer",marginLeft:6}} onClick={()=>elimina(c)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALE FORM CORSO */}
      {modale && (
        <div className="modale-bg" onClick={(e)=>e.target===e.currentTarget&&setModale(null)}>
          <div className="modale">
            <h2>{modale.id?"Modifica":"Nuovo"} corso</h2>
            {errore && <div className="auth__msg auth__msg--err">{errore}</div>}
            <div className="modale-grid">
              <div className="field field--full"><label>Tipologia *</label>
                <select value={modale.id_tipologia} onChange={(e)=>setModale({...modale,id_tipologia:e.target.value})}>
                  <option value="">— seleziona —</option>
                  {tipologie.map((t)=>(<option key={t.id} value={t.id}>{t.tipologia}{t.periodicita?` (${t.periodicita})`:""}</option>))}
                </select></div>
              <div className="field"><label>Data fine corso</label>
                <input type="date" value={modale.data_fine_corso} onChange={(e)=>setModale({...modale,data_fine_corso:e.target.value})} /></div>
              <div className="field"><label>Codice corso</label>
                <input value={modale.cod_corso} onChange={(e)=>setModale({...modale,cod_corso:e.target.value})} /></div>
              <div className="field"><label>Docente</label>
                <input value={modale.docente} onChange={(e)=>setModale({...modale,docente:e.target.value})} /></div>
              <div className="field"><label>Società formatrice</label>
                <input value={modale.societa} onChange={(e)=>setModale({...modale,societa:e.target.value})} /></div>
              <div className="field field--full"><label>Sede del corso</label>
                <input value={modale.sede} onChange={(e)=>setModale({...modale,sede:e.target.value})} /></div>
              <div className="field field--full"><label>Note</label>
                <input value={modale.note} onChange={(e)=>setModale({...modale,note:e.target.value})} /></div>
            </div>
            <div className="modale-azioni">
              <button className="chip" style={{cursor:"pointer"}} onClick={()=>setModale(null)}>Annulla</button>
              <button className="btn" style={{width:"auto",padding:"10px 22px",margin:0}} onClick={salva} disabled={invio}>
                {invio?"Salvataggio…":"Salva"}</button>
            </div>
          </div>
        </div>
      )}

      {/* PANNELLO ISCRITTI */}
      {pannello && (
        <div className="modale-bg" onClick={(e)=>e.target===e.currentTarget&&setPannello(null)}>
          <div className="modale" style={{maxWidth:680}}>
            <h2>Iscritti · {pannello.corso.tipologia}</h2>
            <div style={{fontSize:12.5,color:"var(--dim)",marginBottom:18}}>
              {fmtData(pannello.corso.data_fine_corso)} · {pannello.corso.docente||"docente n.d."}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div>
                <div className="col-tit">Iscritti ({pannello.iscritti.length})</div>
                <div className="lista-box">
                  {pannello.iscritti.length===0 ? <div className="lista-vuota">Nessun iscritto</div> :
                    pannello.iscritti.map((i)=>(
                      <div key={i.iscrizione_id} className="riga-isc">
                        <span>{i.cognome} {i.nome}{tipoOrg==="studio"&&i.azienda?` · ${i.azienda}`:""}</span>
                        <button className="x-btn" onClick={()=>togliIscritto(i.iscrizione_id)} title="Rimuovi">×</button>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <div className="col-tit">Aggiungi lavoratore</div>
                <div className="lista-box">
                  {disponibili.length===0 ? <div className="lista-vuota">Tutti già iscritti</div> :
                    disponibili.map((l)=>(
                      <div key={l.id} className="riga-isc riga-isc--add" onClick={()=>aggiungiIscritto(l.id)}>
                        <span>{l.cognome} {l.nome}{tipoOrg==="studio"&&l.azienda?` · ${l.azienda}`:""}</span>
                        <span className="plus">+</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="modale-azioni">
              <button className="chip" style={{cursor:"pointer"}} onClick={()=>{ setPannello(null); window.location.reload(); }}>Chiudi</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
