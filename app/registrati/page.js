"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import "../auth.css";

function slugify(s) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export default function RegistratiPage() {
  const [supabase] = useState(() => supabaseBrowser());

  const [tipo, setTipo] = useState("azienda");
  const [ragione, setRagione] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTocco, setSlugTocco] = useState(false);
  const [piva, setPiva] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);
  const [invio, setInvio] = useState(false);

  // se l'utente non ha ancora toccato lo slug, lo derivo dalla ragione sociale
  const slugMostrato = slugTocco ? slug : slugify(ragione);

  async function registra() {
    setErrore("");
    const slugFinale = slugMostrato;

    if (!ragione.trim()) return setErrore("Inserisci il nome dello studio o dell'azienda.");
    if (slugFinale.length < 3) return setErrore("Il sottodominio deve avere almeno 3 caratteri.");
    if (!email || !password) return setErrore("Inserisci email e password.");
    if (password.length < 8) return setErrore("La password deve avere almeno 8 caratteri.");

    setInvio(true);

    // 1. crea l'account
    const { data: signUp, error: errSignup } = await supabase.auth.signUp({ email, password });
    if (errSignup) {
      setErrore(
        errSignup.message.includes("already")
          ? "Esiste già un account con questa email. Prova ad accedere."
          : "Registrazione non riuscita. Controlla i dati e riprova."
      );
      setInvio(false);
      return;
    }

    // se la conferma email è attiva, la sessione potrebbe non esserci ancora
    if (!signUp.session) {
      setFatto(true);
      setInvio(false);
      return;
    }

    // 2. crea l'organizzazione (funzione atomica lato DB)
    const { error: errOrg } = await supabase.rpc("registra_organizzazione", {
      p_slug: slugFinale,
      p_tipo: tipo,
      p_ragione_sociale: ragione.trim(),
      p_piva: piva.trim() || null,
    });

    if (errOrg) {
      setErrore(
        errOrg.hint === "slug_occupato"
          ? "Questo sottodominio è già in uso. Scegline un altro."
          : "Account creato, ma la configurazione dello spazio non è riuscita. Contattaci."
      );
      setInvio(false);
      return;
    }

    // 3. tutto ok: manda alla dashboard
    window.location.href = "/dashboard?org=" + encodeURIComponent(slugFinale);
  }

  if (fatto) {
    return (
      <div className="auth">
        <div className="auth__box">
          <div className="auth__card">
            <h1>Controlla la posta</h1>
            <p className="auth__sub">
              Ti abbiamo inviato un link per confermare l'indirizzo. Dopo la conferma potrai
              accedere e completare la configurazione del tuo spazio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth__box">
        <div className="auth__brand">
          <span className="auth__mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.6l5.2 5.2L20 7" stroke="#04121F" strokeWidth="2.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="auth__name">Adempimenti <span>in Cloud</span></span>
        </div>

        <div className="auth__card">
          <h1>Registra il tuo spazio</h1>
          <p className="auth__sub">14 giorni di prova, senza carta di credito.</p>

          {errore && <div className="auth__msg auth__msg--err">{errore}</div>}

          <div className="seg">
            <button type="button" className={tipo === "azienda" ? "on" : ""}
              onClick={() => setTipo("azienda")}>Sono un'azienda</button>
            <button type="button" className={tipo === "studio" ? "on" : ""}
              onClick={() => setTipo("studio")}>Sono uno studio</button>
          </div>
          <p className="seg__desc">
            {tipo === "azienda"
              ? "Gestisci le scadenze dei tuoi dipendenti e delle tue sedi."
              : "Gestisci le scadenze di tutte le aziende che segui, con un portale per ognuna."}
          </p>

          <div className="field">
            <label htmlFor="rag">{tipo === "studio" ? "Nome dello studio" : "Ragione sociale"}</label>
            <input id="rag" value={ragione}
              onChange={(e) => setRagione(e.target.value)}
              placeholder={tipo === "studio" ? "Studio Rossi" : "Metalmeccanica Bianchi Srl"} />
          </div>

          <div className="field">
            <label htmlFor="slug">Il tuo indirizzo</label>
            <input id="slug" value={slugMostrato}
              onChange={(e) => { setSlugTocco(true); setSlug(slugify(e.target.value)); }}
              placeholder="studiorossi" />
            <span className="field__hint">
              {slugMostrato || "…"}.adempimentiincloud.it
            </span>
          </div>

          <div className="field">
            <label htmlFor="piva">Partita IVA <span style={{ textTransform: "none", letterSpacing: 0 }}>(facoltativa ora)</span></label>
            <input id="piva" value={piva}
              onChange={(e) => setPiva(e.target.value)} placeholder="01234567890" />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@azienda.it" autoComplete="email" />
          </div>

          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="almeno 8 caratteri" autoComplete="new-password" />
          </div>

          <button className="btn" onClick={registra} disabled={invio}>
            {invio ? "Creazione in corso…" : "Crea il mio spazio"}
          </button>
        </div>

        <p className="auth__foot">
          Hai già un account? <a href="/login">Accedi</a>
        </p>
      </div>
    </div>
  );
}
