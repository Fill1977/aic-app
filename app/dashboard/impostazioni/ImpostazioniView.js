"use client";
import { useState } from "react";
import { salvaOrg } from "./actions";

export default function ImpostazioniView({ sessione, slug }) {
  const [d, setD] = useState({
    ragione_sociale: sessione.ragione_sociale || "", piva: sessione.piva || "",
    indirizzo: sessione.indirizzo || "", citta: sessione.citta || "",
    prov: sessione.prov || "", cap: sessione.cap || "",
    cod_ateco: sessione.cod_ateco || "", email: sessione.email || "", n_tel: sessione.n_tel || "",
  });
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [invio, setInvio] = useState(false);
  const soloLettura = sessione.ruolo !== "owner";
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });

  async function salva() {
    setMsg(""); setErr("");
    if (!d.ragione_sociale.trim()) { setErr("La ragione sociale è obbligatoria."); return; }
    setInvio(true);
    const res = await salvaOrg(slug, d);
    setInvio(false);
    if (res.errore) { setErr(res.errore); return; }
    setMsg("Dati salvati.");
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 18 }}>Dati aziendali</h2>
      {msg && <div className="auth__msg auth__msg--ok">{msg}</div>}
      {err && <div className="auth__msg auth__msg--err">{err}</div>}
      <div className="modale-grid">
        <div className="field field--full"><label>Ragione sociale *</label>
          <input value={d.ragione_sociale} disabled={soloLettura} onChange={set("ragione_sociale")} /></div>
        <div className="field"><label>P.IVA</label>
          <input value={d.piva} disabled={soloLettura} onChange={set("piva")} /></div>
        <div className="field"><label>Codice ATECO</label>
          <input value={d.cod_ateco} disabled={soloLettura} onChange={set("cod_ateco")} /></div>
        <div className="field field--full"><label>Indirizzo</label>
          <input value={d.indirizzo} disabled={soloLettura} onChange={set("indirizzo")} /></div>
        <div className="field"><label>Città</label>
          <input value={d.citta} disabled={soloLettura} onChange={set("citta")} /></div>
        <div className="field"><label>Prov</label>
          <input value={d.prov} maxLength={2} disabled={soloLettura} onChange={set("prov")} /></div>
        <div className="field"><label>CAP</label>
          <input value={d.cap} disabled={soloLettura} onChange={set("cap")} /></div>
        <div className="field"><label>Email</label>
          <input value={d.email} disabled={soloLettura} onChange={set("email")} /></div>
        <div className="field"><label>Telefono</label>
          <input value={d.n_tel} disabled={soloLettura} onChange={set("n_tel")} /></div>
      </div>
      {!soloLettura ? (
        <button className="btn" style={{ width: "auto", padding: "11px 26px", marginTop: 18 }} onClick={salva} disabled={invio}>
          {invio ? "Salvataggio…" : "Salva"}
        </button>
      ) : <p style={{color:"var(--dim)",fontSize:13,marginTop:14}}>Solo il titolare può modificare.</p>}
    </div>
  );
}
