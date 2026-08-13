"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const TIPI = ["preventiva", "periodica", "cambio mansione", "rientro (>60gg)", "su richiesta", "cessazione"];
const GIUDIZI = ["idoneo", "idoneo con prescrizioni", "inidoneo temporaneo", "inidoneo permanente"];
const SOGLIA = 90;

function statoDi(dataScad) {
  if (!dataScad) return { k: "illim", label: "senza scadenza" };
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  const g = Math.round((new Date(dataScad) - oggi) / 86400000);
  if (g < 0) return { k: "scaduto", label: `scaduta da ${-g}g` };
  if (g <= SOGLIA) return { k: "imminente", label: `tra ${g}g` };
  return { k: "ok", label: "valida" };
}
const fmt = (d) => d ? new Date(d).toLocaleDateString("it-IT") : "—";
const vuotaForm = { id: null, lavoratore_id: "", tipo_visita: "periodica", data_visita: "",
  periodicita_mesi: "", prossima_visita: "", giudizio_idoneita: "idoneo",
  prescrizioni: "", medico_competente: "", note: "" };

export default function VisiteView({ visite, lavoratori, slug }) {
  const router = useRouter();
  const [supabase] = useState(() => supabaseBrowser());
  const [filtro, setFiltro] = useState("tutte");
  const [q, setQ] = useState("");
  const [mostraArch, setMostraArch] = useState(false);
  const [modale, setModale] = useState(false);
  const [form, setForm] = useState(vuotaForm);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState("");

  const righe = useMemo(() => visite.map((v) => ({ ...v, stato: statoDi(v.data_scadenza) })), [visite]);

  const kpi = useMemo(() => {
    const c = { scaduto: 0, imminente: 0, ok: 0 };
    righe.forEach((r) => { if (c[r.stato.k] !== undefined) c[r.stato.k]++; });
    return c;
  }, [righe]);

  const filtrate = useMemo(() => {
    const t = q.trim().toLowerCase();
    return righe.filter((r) => {
      if (!mostraArch && r.archiviata) return false;
      if (filtro !== "tutte" && r.stato.k !== filtro) return false;
      if (!t) return true;
      return `${r.nome} ${r.cognome} ${r.azienda || ""} ${r.mansione || ""}`.toLowerCase().includes(t);
    });
  }, [righe, filtro, q, mostraArch]);

  function apri(v) {
    setErrore("");
    if (v) setForm({
      id: v.id, lavoratore_id: v.lavoratore_id, tipo_visita: v.tipo_visita,
      data_visita: v.data_visita || "", periodicita_mesi: v.periodicita_mesi ?? "",
      prossima_visita: v.prossima_visita || "", giudizio_idoneita: v.giudizio_idoneita || "idoneo",
      prescrizioni: v.prescrizioni || "", medico_competente: v.medico_competente || "", note: v.note || "",
    });
    else setForm(vuotaForm);
    setModale(true);
  }

  async function salva() {
    if (!form.lavoratore_id || !form.data_visita) { setErrore("Lavoratore e data visita sono obbligatori."); return; }
    setSalvando(true); setErrore("");
    const { error } = await supabase.rpc("salva_visita_slug", {
      p_slug: slug, p_id: form.id, p_lavoratore_id: Number(form.lavoratore_id),
      p_tipo_visita: form.tipo_visita, p_data_visita: form.data_visita,
      p_periodicita_mesi: form.periodicita_mesi === "" ? null : Number(form.periodicita_mesi),
      p_prossima_visita: form.prossima_visita || null, p_giudizio: form.giudizio_idoneita,
      p_prescrizioni: form.prescrizioni || null, p_medico: form.medico_competente || null,
      p_note: form.note || null,
    });
    setSalvando(false);
    if (error) { setErrore(error.message); return; }
    setModale(false); router.refresh();
  }

  async function elimina(id) {
    if (!confirm("Eliminare questa visita?")) return;
    const { error } = await supabase.rpc("elimina_visita_slug", { p_slug: slug, p_id: id });
    if (error) { alert(error.message); return; }
    router.refresh();
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="riepilogo">
        <div className="kpi kpi--scaduto"><div className="kpi__num">{kpi.scaduto}</div><div className="kpi__label">Scadute</div></div>
        <div className="kpi kpi--imminente"><div className="kpi__num">{kpi.imminente}</div><div className="kpi__label">In scadenza (≤{SOGLIA}gg)</div></div>
        <div className="kpi kpi--ok"><div className="kpi__num">{kpi.ok}</div><div className="kpi__label">Valide</div></div>
      </div>

      <div className="filtri">
        {["tutte", "scaduto", "imminente", "ok"].map((f) => (
          <button key={f} className={`chip ${filtro === f ? "chip--on" : ""}`} onClick={() => setFiltro(f)}>
            {f === "tutte" ? "Tutte" : f === "scaduto" ? "Scadute" : f === "imminente" ? "In scadenza" : "Valide"}
          </button>
        ))}
        <button className={`chip ${mostraArch ? "chip--on" : ""}`} onClick={() => setMostraArch((v) => !v)}>Mostra archiviate</button>
        <input className="search" placeholder="Cerca nominativo, azienda…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="chip chip--on" onClick={() => apri(null)}><span className="plus">＋</span>&nbsp;Nuova visita</button>
      </div>

      {filtrate.length === 0 ? (
        <div className="vuoto"><h3>Nessuna visita</h3><p>Registra la prima visita di sorveglianza sanitaria.</p></div>
      ) : (
        <div className="tabella-wrap">
          <table className="scad">
            <thead><tr>
              <th>Lavoratore</th><th className="cell-hide-sm">Azienda</th><th>Tipo</th>
              <th>Data visita</th><th className="cell-hide-sm">Giudizio</th><th>Scadenza</th><th></th>
            </tr></thead>
            <tbody>
              {filtrate.map((r) => (
                <tr key={r.id} style={r.archiviata ? { opacity: 0.55 } : undefined}>
                  <td>
                    <div className="cell-nome">{r.cognome} {r.nome}{r.archiviata && <span className="nav__soon" style={{ marginLeft: 6 }}>archiviata</span>}</div>
                    {r.mansione && <div className="cell-sub">{r.mansione}</div>}
                  </td>
                  <td className="cell-hide-sm cell-azienda">{r.azienda || "—"}</td>
                  <td className="cell-corso">{r.tipo_visita}</td>
                  <td className="cell-corso">{fmt(r.data_visita)}</td>
                  <td className="cell-hide-sm cell-corso">{r.giudizio_idoneita || "—"}</td>
                  <td className="cell-scad">
                    <span className={`pill pill--${r.stato.k}`}><span className="pill__dot" />{r.stato.label}</span>
                    <div className="cell-sub" style={{ textAlign: "right" }}>{fmt(r.data_scadenza)}</div>
                  </td>
                  <td className="cell-scad">
                    <button className="chip" onClick={() => apri(r)}>Modifica</button>
                    <button className="x-btn" title="Elimina" onClick={() => elimina(r.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modale && (
        <div className="modale-bg" onMouseDown={(e) => e.target === e.currentTarget && setModale(false)}>
          <div className="modale">
            <h2>{form.id ? "Modifica visita" : "Nuova visita"}</h2>
            {errore && <div className="auth__msg auth__msg--err">{errore}</div>}
            <div className="modale-grid">
              <div className="field field--full">
                <label>Lavoratore</label>
                <select value={form.lavoratore_id} onChange={set("lavoratore_id")}>
                  <option value="">— seleziona —</option>
                  {lavoratori.map((l) => (
                    <option key={l.id} value={l.id}>{l.cognome} {l.nome}{l.mansione ? ` · ${l.mansione}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tipo visita</label>
                <select value={form.tipo_visita} onChange={set("tipo_visita")}>
                  {TIPI.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Data visita</label>
                <input type="date" value={form.data_visita} onChange={set("data_visita")} />
              </div>
              <div className="field">
                <label>Periodicità (mesi)</label>
                <input type="number" min="0" placeholder="es. 12" value={form.periodicita_mesi} onChange={set("periodicita_mesi")} />
              </div>
              <div className="field">
                <label>Prossima visita (override)</label>
                <input type="date" value={form.prossima_visita} onChange={set("prossima_visita")} />
              </div>
              <div className="field field--full">
                <label>Giudizio di idoneità</label>
                <select value={form.giudizio_idoneita} onChange={set("giudizio_idoneita")}>
                  {GIUDIZI.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="field field--full">
                <label>Prescrizioni / limitazioni</label>
                <input value={form.prescrizioni} onChange={set("prescrizioni")} placeholder="limitazioni note al datore per l'adibizione alla mansione" />
              </div>
              <div className="field">
                <label>Medico competente</label>
                <input value={form.medico_competente} onChange={set("medico_competente")} />
              </div>
              <div className="field">
                <label>Note</label>
                <input value={form.note} onChange={set("note")} />
              </div>
            </div>
            <div className="modale-azioni">
              <button className="chip" onClick={() => setModale(false)}>Annulla</button>
              <button className="chip chip--on" disabled={salvando} onClick={salva}>{salvando ? "Salvataggio…" : "Salva"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
