"use client";
import { useState } from "react";
import { salvaCliente, disattivaCliente } from "./actions";

const VUOTO = {
  id: null, azienda: "", piva: "", indirizzo: "", citta: "", prov: "",
  cap: "", cod_ateco: "", mail: "", n_tel: "", note: "",
};

export default function ClientiView({ clienti, slug, tipoOrg }) {
  const [modale, setModale] = useState(null);
  const [q, setQ] = useState("");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);

  const filtrati = clienti.filter((c) => {
    if (!q.trim()) return true;
    return `${c.azienda} ${c.citta||""} ${c.piva||""}`.toLowerCase().includes(q.toLowerCase());
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
    if (!modale.azienda.trim()) { setErrore("Il nome dell'azienda è obbligatorio."); return; }
    setInvio(true);
    const res = await salvaCliente(slug, modale);
    setInvio(false);
    if (res.errore) { setErrore(res.errore); return; }
    window.location.reload();
  }

  async function disattiva(c) {
    if (!confirm(`Archiviare "${c.azienda}"?`)) return;
    const res = await disattivaCliente(slug, c.id);
    if (res.errore) { alert(res.errore); return; }
    window.location.reload();
  }

  return (
    <>
      <div className="filtri">
        <input className="search" placeholder="Cerca azienda, città, P.IVA…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="chip chip--on" style={{cursor:"pointer"}} onClick={()=>apri(null)}>+ Nuovo cliente</button>
      </div>

      {filtrati.length===0 ? (
        <div className="vuoto"><h3>Nessun cliente</h3><p>Aggiungi il primo con il pulsante qui sopra.</p></div>
      ) : (
        <div className="tabella-wrap">
          <table className="scad">
            <thead><tr>
              <th>Azienda</th><th className="cell-hide-sm">Località</th>
              <th className="cell-hide-sm">P.IVA</th><th style={{textAlign:"right"}}>Azioni</th>
            </tr></thead>
            <tbody>
              {filtrati.map((c)=>(
                <tr key={c.id}>
                  <td><div className="cell-nome">{c.azienda}</div>
                    {c.mail && <div className="cell-sub">{c.mail}</div>}</td>
                  <td className="cell-hide-sm"><span className="cell-azienda">{[c.citta,c.prov].filter(Boolean).join(" ")||"—"}</span></td>
                  <td className="cell-hide-sm"><span className="cell-azienda">{c.piva||"—"}</span></td>
                  <td style={{textAlign:"right",whiteSpace:"nowrap"}}>
                    <button className="chip" style={{cursor:"pointer"}} onClick={()=>apri(c)}>Modifica</button>
                    <button className="chip" style={{cursor:"pointer",marginLeft:6}} onClick={()=>disattiva(c)}>Archivia</button>
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
            <h2>{modale.id?"Modifica":"Nuovo"} cliente</h2>
            {errore && <div className="auth__msg auth__msg--err">{errore}</div>}
            <div className="modale-grid">
              <div className="field field--full"><label>Ragione sociale *</label>
                <input value={modale.azienda} onChange={(e)=>setModale({...modale,azienda:e.target.value})} /></div>
              <div className="field"><label>P.IVA</label>
                <input value={modale.piva} onChange={(e)=>setModale({...modale,piva:e.target.value})} /></div>
              <div className="field"><label>Codice ATECO</label>
                <input value={modale.cod_ateco} onChange={(e)=>setModale({...modale,cod_ateco:e.target.value})} /></div>
              <div className="field field--full"><label>Indirizzo</label>
                <input value={modale.indirizzo} onChange={(e)=>setModale({...modale,indirizzo:e.target.value})} /></div>
              <div className="field"><label>Città</label>
                <input value={modale.citta} onChange={(e)=>setModale({...modale,citta:e.target.value})} /></div>
              <div className="field"><label>Prov</label>
                <input value={modale.prov} maxLength={2} onChange={(e)=>setModale({...modale,prov:e.target.value})} /></div>
              <div className="field"><label>CAP</label>
                <input value={modale.cap} onChange={(e)=>setModale({...modale,cap:e.target.value})} /></div>
              <div className="field"><label>Email di riferimento</label>
                <input value={modale.mail} onChange={(e)=>setModale({...modale,mail:e.target.value})} /></div>
              <div className="field"><label>Telefono</label>
                <input value={modale.n_tel} onChange={(e)=>setModale({...modale,n_tel:e.target.value})} /></div>
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
    </>
  );
}
