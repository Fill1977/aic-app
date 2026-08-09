"use client";
import { useState } from "react";
import { salvaTipologia, eliminaTipologia } from "./actions";

export default function GestioneTipologie({ dati, slug }) {
  const [form, setForm] = useState(null);   // null | {id,tipologia,id_periodicita,durata_ore}
  const [err, setErr] = useState("");
  const tipologie = dati.tipologie;
  const periodicita = dati.periodicita;

  function nuova() { setErr(""); setForm({ id:null, tipologia:"", id_periodicita:"", durata_ore:"" }); }
  function modifica(t) { setErr(""); setForm({ id:t.id, tipologia:t.tipologia, id_periodicita:t.id_periodicita||"", durata_ore:t.durata_ore||"" }); }

  async function salva() {
    setErr("");
    if (!form.tipologia.trim()) { setErr("Nome tipologia obbligatorio."); return; }
    const res = await salvaTipologia(slug, form);
    if (res.errore) { setErr(res.errore); return; }
    window.location.reload();
  }
  async function elimina(t) {
    if (!confirm(`Eliminare "${t.tipologia}"?`)) return;
    const res = await eliminaTipologia(slug, t.id);
    if (res.errore) { alert(res.errore); return; }
    window.location.reload();
  }

  const proprie = tipologie.filter((t)=>!t.di_sistema);
  const sistema = tipologie.filter((t)=>t.di_sistema);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:18, margin:0 }}>Tipologie di corso</h2>
        {!form && <button className="chip chip--on" style={{cursor:"pointer"}} onClick={nuova}>+ Nuova tipologia</button>}
      </div>

      {form ? (
        <div className="modale" style={{maxWidth:560,margin:0,boxShadow:"none",border:"1px solid var(--border)"}}>
          <h2>{form.id?"Modifica":"Nuova"} tipologia</h2>
          {err && <div className="auth__msg auth__msg--err">{err}</div>}
          <div className="modale-grid">
            <div className="field field--full"><label>Nome tipologia *</label>
              <input value={form.tipologia} onChange={(e)=>setForm({...form,tipologia:e.target.value})} /></div>
            <div className="field"><label>Periodicità</label>
              <select value={form.id_periodicita} onChange={(e)=>setForm({...form,id_periodicita:e.target.value})}>
                <option value="">— nessuna —</option>
                {periodicita.map((p)=>(<option key={p.id} value={p.id}>{p.nome}</option>))}
              </select></div>
            <div className="field"><label>Durata (ore)</label>
              <input type="number" value={form.durata_ore} onChange={(e)=>setForm({...form,durata_ore:e.target.value})} /></div>
          </div>
          <div className="modale-azioni">
            <button className="chip" style={{cursor:"pointer"}} onClick={()=>setForm(null)}>Annulla</button>
            <button className="btn" style={{width:"auto",padding:"10px 22px",margin:0}} onClick={salva}>Salva</button>
          </div>
        </div>
      ) : (
        <>
          {proprie.length>0 && (
            <>
              <div className="col-tit" style={{marginBottom:8}}>Le tue tipologie</div>
              <div className="lista-box" style={{marginBottom:22}}>
                {proprie.map((t)=>(
                  <div key={t.id} className="riga-isc">
                    <span>{t.tipologia}
                      <span style={{color:"var(--dim)",fontSize:12}}>
                        {t.periodicita?` · ${t.periodicita}`:""}{t.durata_ore?` · ${t.durata_ore}h`:""}</span></span>
                    <span style={{whiteSpace:"nowrap"}}>
                      <button className="chip" style={{cursor:"pointer"}} onClick={()=>modifica(t)}>Modifica</button>
                      <button className="x-btn" style={{marginLeft:6}} onClick={()=>elimina(t)}>×</button>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="col-tit" style={{marginBottom:8}}>Tipologie di sistema (sola lettura)</div>
          <div className="lista-box">
            {sistema.map((t)=>(
              <div key={t.id} className="riga-isc">
                <span>{t.tipologia}
                  <span style={{color:"var(--dim)",fontSize:12}}>
                    {t.periodicita?` · ${t.periodicita}`:""}{t.durata_ore?` · ${t.durata_ore}h`:""}</span></span>
                <span className="nav__soon">sistema</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
