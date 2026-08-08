"use client";
import { useState } from "react";
import { salvaSede, archiviaSede } from "./actions";

const VUOTO = { id:null, cliente_id:"", nome:"", indirizzo:"", citta:"", prov:"", cap:"", email:"", note:"" };

export default function SediView({ sedi, clienti, slug, tipoOrg }) {
  const [modale, setModale] = useState(null);
  const [q, setQ] = useState("");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);
  const labelCli = tipoOrg === "studio" ? "Cliente" : "Azienda";

  const filtrate = sedi.filter((s) => {
    if (!q.trim()) return true;
    return `${s.nome} ${s.azienda||""}`.toLowerCase().includes(q.toLowerCase());
  });

  function apri(s) {
    setErrore("");
    if (!s) { setModale({ ...VUOTO, cliente_id: clienti[0]?.id || "" }); return; }
    const p = { ...VUOTO };
    for (const k in VUOTO) p[k] = s[k] ?? "";
    p.id = s.id; p.cliente_id = s.cliente_id;
    setModale(p);
  }

  async function salva() {
    setErrore("");
    if (!modale.nome.trim()) { setErrore("Il nome della sede è obbligatorio."); return; }
    let payload = { ...modale };
    // per gli studi serve il cliente scelto; per le aziende lo ricava il server
    if (!payload.cliente_id && clienti.length >= 1) payload.cliente_id = clienti[0].id;
    setInvio(true);
    const res = await salvaSede(slug, payload);
    setInvio(false);
    if (res.errore) { setErrore(res.errore); return; }
    window.location.reload();
  }

  async function archivia(s) {
    if (!confirm(`Archiviare la sede "${s.nome}"?`)) return;
    const res = await archiviaSede(slug, s.id);
    if (res.errore) { alert(res.errore); return; }
    window.location.reload();
  }

  return (
    <>
      <div className="filtri">
        <input className="search" placeholder="Cerca sede o azienda…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="chip chip--on" style={{cursor:"pointer"}} onClick={()=>apri(null)}
          disabled={tipoOrg==="studio" && clienti.length===0}>+ Nuova sede</button>
      </div>

      {clienti.length===0 && tipoOrg==="studio" && (
        <div className="avviso"><div className="avviso__titolo">Nessun cliente disponibile</div>
        <div className="avviso__sub">Crea prima un cliente: la sua sede legale nascerà da sola.</div></div>
      )}

      {filtrate.length===0 ? (
        <div className="vuoto"><h3>Nessuna sede</h3><p>Le sedi legali si creano da sole con i clienti. Aggiungi altre sedi qui.</p></div>
      ) : (
        <div className="tabella-wrap">
          <table className="scad">
            <thead><tr>
              <th>Sede</th><th className="cell-hide-sm">{labelCli}</th>
              <th style={{textAlign:"center"}}>Tipo</th><th style={{textAlign:"right"}}>Azioni</th>
            </tr></thead>
            <tbody>
              {filtrate.map((s)=>(
                <tr key={s.id}>
                  <td><div className="cell-nome">{s.nome}</div></td>
                  <td className="cell-hide-sm"><span className="cell-azienda">{s.azienda}</span></td>
                  <td style={{textAlign:"center"}}>
                    {s.legale ? <span className="pill pill--ok"><span className="pill__dot"/>Legale</span>
                      : <span style={{color:"var(--dim)",fontSize:12}}>secondaria</span>}
                  </td>
                  <td style={{textAlign:"right",whiteSpace:"nowrap"}}>
                    <button className="chip" style={{cursor:"pointer"}} onClick={()=>apri(s)}>Modifica</button>
                    {!s.legale && <button className="chip" style={{cursor:"pointer",marginLeft:6}} onClick={()=>archivia(s)}>Archivia</button>}
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
            <h2>{modale.id?"Modifica":"Nuova"} sede</h2>
            {errore && <div className="auth__msg auth__msg--err">{errore}</div>}
            <div className="modale-grid">
              {tipoOrg === "studio" && (
                <div className="field field--full"><label>Cliente *</label>
                  <select value={modale.cliente_id} disabled={!!modale.id}
                    onChange={(e)=>setModale({...modale,cliente_id:e.target.value})}>
                    <option value="">— seleziona —</option>
                    {clienti.map((c)=>(<option key={c.id} value={c.id}>{c.azienda}</option>))}
                  </select></div>
              )}
              <div className="field field--full"><label>Nome sede *</label>
                <input value={modale.nome} onChange={(e)=>setModale({...modale,nome:e.target.value})} /></div>
              <div className="field field--full"><label>Indirizzo</label>
                <input value={modale.indirizzo} onChange={(e)=>setModale({...modale,indirizzo:e.target.value})} /></div>
              <div className="field"><label>Città</label>
                <input value={modale.citta} onChange={(e)=>setModale({...modale,citta:e.target.value})} /></div>
              <div className="field"><label>Prov</label>
                <input value={modale.prov} maxLength={2} onChange={(e)=>setModale({...modale,prov:e.target.value})} /></div>
              <div className="field"><label>CAP</label>
                <input value={modale.cap} onChange={(e)=>setModale({...modale,cap:e.target.value})} /></div>
              <div className="field field--full"><label>Email di riferimento</label>
                <input value={modale.email} onChange={(e)=>setModale({...modale,email:e.target.value})} /></div>
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
