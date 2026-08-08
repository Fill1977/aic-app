"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import "../auth.css";

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => supabaseBrowser());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);

  async function accedi() {
    setErrore("");
    if (!email || !password) {
      setErrore("Inserisci email e password.");
      return;
    }
    setInvio(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrore("Email o password non corretti.");
      setInvio(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
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
          <h1>Accedi</h1>
          <p className="auth__sub">Entra nel tuo spazio di lavoro.</p>

          {errore && <div className="auth__msg auth__msg--err">{errore}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && accedi()}
              placeholder="tu@studio.it" autoComplete="email" />
          </div>

          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && accedi()}
              placeholder="••••••••" autoComplete="current-password" />
          </div>

          <button className="btn" onClick={accedi} disabled={invio}>
            {invio ? "Accesso in corso…" : "Accedi"}
          </button>
        </div>

        <p className="auth__foot">
          Non hai un account? <a href="/registrati">Registra il tuo spazio</a>
        </p>
      </div>
    </div>
  );
}
