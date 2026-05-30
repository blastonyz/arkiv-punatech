import { AgentChat } from "@/components/AgentChat";
import { MemoryInspector } from "@/components/MemoryInspector";
import { isWriterConfigured } from "@/lib/arkiv/client";
import { agentWalletAddress } from "@/lib/arkiv/client";
import { BRAGA_EXPLORER_URL } from "@/lib/arkiv/project";

export const dynamic = "force-dynamic";

export default function AgentPage() {
  return (
    <main className="page-frame">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="agent-shell">
        <header className="agent-header">
          <div>
            <span className="eyebrow">MemoryForge AI</span>
            <h1>Agente con memoria evolutiva</h1>
          </div>
          <div className="agent-status-row">
            <span className={`badge ${isWriterConfigured ? "badge-live" : "badge-muted"}`}>
              {isWriterConfigured ? "Arkiv: writes live" : "Arkiv: read-only"}
            </span>
            {agentWalletAddress && (
              <a
                href={`${BRAGA_EXPLORER_URL}address/${agentWalletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-outline"
              >
                {agentWalletAddress.slice(0, 8)}…
              </a>
            )}
          </div>
        </header>

        <div className="agent-grid">
          <section className="panel agent-chat-panel">
            <AgentChat agentId="memoryforge-default" userId={agentWalletAddress ?? undefined} />
          </section>

          <section className="panel memory-panel">
            <MemoryInspector
              agentId="memoryforge-default"
              userId={agentWalletAddress ?? undefined}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
