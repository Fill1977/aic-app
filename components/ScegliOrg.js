export default function ScegliOrg({ orgs }) {
  return (
    <div className="gate"><div className="gate__box">
      <h1>Scegli lo spazio</h1>
      <p>Sei membro di più organizzazioni.</p>
      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        {orgs.map((o) => (
          <a key={o.slug} href={`/dashboard?org=${encodeURIComponent(o.slug)}`}
             className="chip" style={{ padding: "12px 18px", textDecoration: "none" }}>
            {o.ragione_sociale}
          </a>
        ))}
      </div>
    </div></div>
  );
}
