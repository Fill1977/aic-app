// Validazione codice fiscale: struttura + coerenza con cognome/nome.
const PATTERN = /^[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]$/;

function consonanti(s){ return (s||"").toUpperCase().replace(/[^A-Z]/g,"").replace(/[AEIOU]/g,""); }
function vocali(s){ return (s||"").toUpperCase().replace(/[^A-Z]/g,"").replace(/[^AEIOU]/g,""); }

function codiceCognome(c){ return (consonanti(c)+vocali(c)+"XXX").slice(0,3); }
function codiceNome(n){
  const cons = consonanti(n);
  if (cons.length >= 4) return cons[0]+cons[2]+cons[3];
  return (cons+vocali(n)+"XXX").slice(0,3);
}

// ritorna {ok, msg}
export function validaCF(cf, cognome, nome) {
  const v = (cf||"").toUpperCase().trim();
  if (!v) return { ok: true };                 // vuoto = ammesso (non obbligatorio)
  if (v.length !== 16) return { ok:false, msg:"Il CF deve avere 16 caratteri." };
  if (!PATTERN.test(v)) return { ok:false, msg:"Struttura del CF non valida." };
  if (cognome && codiceCognome(cognome) !== v.slice(0,3))
    return { ok:false, msg:"Il CF non corrisponde al cognome." };
  if (nome && codiceNome(nome) !== v.slice(3,6))
    return { ok:false, msg:"Il CF non corrisponde al nome." };
  return { ok:true };
}
