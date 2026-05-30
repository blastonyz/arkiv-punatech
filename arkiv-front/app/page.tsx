import Link from "next/link";

export default function Home() {
  return (
    <main className="page-frame">

      <div className="landing-shell">
        <span className="eyebrow">PunaTech x Arkiv</span>
        <h1>MemoryForge AI</h1>
        <p className="hero-copy">
          Memoria evolutiva y verificable para agentes de IA. Cada memoria nace con expiración,
          sobrevive si se usa en decisiones y queda auditada en Arkiv Braga.
        </p>

        <div className="landing-features">
          <div className="feature-card">
            <span className="feature-icon">🧠</span>
            <div className="feature-card-body">
              <h3>Memoria evolutiva</h3>
              <p>Las memorias nacen con TTL corto y se refuerzan solo si demuestran utilidad.</p>
            </div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔗</span>
            <div className="feature-card-body">
              <h3>Citations on-chain</h3>
              <p>Cada decisión registra las memorias citadas con hash verificable en Arkiv.</p>
            </div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔍</span>
            <div className="feature-card-body">
              <h3>Audit hash-chain</h3>
              <p>El historial no se puede reescribir. Cada snapshot encadena el anterior.</p>
            </div>
          </div>
        </div>

        <Link href="/agent" className="cta-button">
          Iniciar sesión con el agente →
        </Link>
      </div>
    </main>
  );
}
