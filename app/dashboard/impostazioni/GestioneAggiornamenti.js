"use client";
import { useState } from "react";
import { salvaCorrispondenza, eliminaCorrispondenza } from "./actions";

export default function GestioneAggiornamenti({ dati, slug }) {
  const [base, setBase] = useState("");
  const [agg, setAgg] = useState("");
  const [err, setErr] = useState("");
  const corr = dati.corrispondenze;
  const tipologie = dati.tipologie;

  async function aggiungi() {
    setErr("");
    if (!base || !agg) { setErr("Seleziona sia il corso base che l'aggiornamento."); return; }
    if (base === agg) { setErr("Base e aggiornamento non possono coincidere."); return; }
    const res = await salvaCorrispondenza(slug, Number(base), Number(agg));
    if (res.errore) { setErr(res.errore); return; }
    window.location.reload();
  }
  async function elimina(c) {
    if (!confirm(`Eliminare la catena "${c.base}" → "${c.aggiornamento}"?`)) return;
    const res = await eliminaCorrispondenza(slug, c.id);
    if (res.errore) { alert(res.errore); return; }
    window.location.reload();
  }

  const proprie = corr.filter((c)=>!c.di_sistema);
  const sistema = corr.filter((c)=>c.di_sistema);

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={{ fontFamily:"var(--font-display)", fontSize:18, marginBottom:6 }}>Catene di aggiornamento</h2>
      <p style={{fontSize:12.5,color:"var(--dim)",margin:"0 0 20px",lineHeight:1.5}}>
        Collegano un corso base al suo aggiornamento: quando un lavoratore fa l'aggiornamento,
        lo scadenzario considera valida la nuova scadenza e non segnala più il corso base come scaduto.
      </p>

      {/* form aggiunta */}
      <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap",marginBottom:8}}>
        <div className="field" style={{flex:1,minWidth:200}}><label>Corso base</label>
          <select value={base} onChange={(e)=>setBase(e.target.value)}>
            <option value="">— seleziona —</option>
            {tipologie.map((t)=>(<option key={t.id} value={t.id}>{t.tipologia}</option>))}
          </select></div>
        <div style={{alignSelf:"center",color:"var(--dim)",paddingBottom:10}}>→</div>
        <div className="field" style={{flex:1,minWidth:200}}><label>Aggiornamento</label>
          <select value={agg} onChange={(e)=>setAgg(e.target.value)}>
            <option value="">— seleziona —</option>
            {tipologie.map((t)=>(<option key={t.id} value={t.id}>{t.tipologia}</option>))}
          </select></div>
        <button className="chip chip--on" style={{cursor:"pointer",padding:"10px 18px"}} onClick={aggiungi}>Aggiungi</button>
      </div>
      {err && <div className="auth__msg auth__msg--err" style={{marginBottom:16}}>{err}</div>}

      {proprie.length>0 && (
        <>
          <div className="col-tit" style={{margin:"20px 0 8px"}}>Le tue catene</div>
          <div className="lista-box" style={{marginBottom:22}}>
            {proprie.map((c)=>(
              <div key={c.id} className="riga-isc">
                <span>{c.base} <span style={{color:"var(--ciano)"}}>→</span> {c.aggiornamento}</span>
                <button className="x-btn" onClick={()=>elimina(c)}>×</button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="col-tit" style={{margin:"20px 0 8px"}}>Catene di sistema (sola lettura)</div>
      <div className="lista-box">
        {sistema.map((c)=>(
          <div key={c.id} className="riga-isc">
            <span>{c.base} <span style={{color:"var(--ciano)"}}>→</span> {c.aggiornamento}</span>
            <span className="nav__soon">sistema</span>
          </div>
        ))}
      </div>
    </div>
  );
}
