"use client";

import { useState, useTransition } from "react";

const BRAGA_EXPLORER_ENTITY_URL = (key: string) =>
  `https://explorer.braga.hoodi.arkiv.network/entity/${key}`;

type Memory = {
  key: string;
  memoryId: string;
  content: string;
  scope: string;
  memoryType: string;
  status: string;
  importanceScore: number;
  utilityScore: number;
  citationCount: number;
};

type MemoryInspectorProps = {
  agentId?: string;
  userId?: string;
};

export function MemoryInspector({ agentId = "memoryforge-default", userId }: MemoryInspectorProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newContent, setNewContent] = useState("");
  const [memoryType, setMemoryType] = useState("preference");
  const [scope, setScope] = useState<"run" | "entity" | "global">("entity");
  const [addError, setAddError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, startLoad] = useTransition();

  function loadMemories() {
    startLoad(async () => {
      const params = new URLSearchParams({ agentId });
      if (userId) params.set("userId", userId);
      const res = await fetch(`/api/memories?${params}`);
      const data = (await res.json()) as { memories?: Memory[] };
      setMemories(data.memories ?? []);
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setAddError("");

    startTransition(async () => {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          memoryType,
          scope,
          importanceScore: 60,
          agentId,
          userId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAddError(data.error ?? "Error al guardar la memoria.");
        return;
      }
      setNewContent("");
      loadMemories();
    });
  }

  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  async function handleDelete(entityKey: string) {
    setDeletingKey(entityKey);
    await fetch(`/api/memories?entityKey=${encodeURIComponent(entityKey)}`, { method: "DELETE" }).catch(() => null);
    setDeletingKey(null);
    loadMemories();
  }

  return (
    <div className="memory-inspector">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Memory Inspector</span>
          <h2>Memorias activas del agente</h2>
        </div>
        <button className="btn-outline" onClick={loadMemories} disabled={isLoading}>
          {isLoading ? "Cargando…" : "Actualizar"}
        </button>
      </div>

      <form className="composer-form memory-add-form" onSubmit={handleAdd}>
        <label>
          <span>Contenido</span>
          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="El usuario prefiere respuestas cortas y en español."
            maxLength={1000}
          />
        </label>
        <div className="memory-form-row">
          <label>
            <span>Tipo</span>
            <input value={memoryType} onChange={(e) => setMemoryType(e.target.value)} />
          </label>
          <label>
            <span>Scope</span>
            <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
              <option value="run">run (1h)</option>
              <option value="entity">entity (7d)</option>
              <option value="global">global (365d)</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={isPending || !newContent.trim()}>
          {isPending ? "Guardando…" : "Agregar memoria"}
        </button>
        {addError && <p className="form-message form-message-error">{addError}</p>}
      </form>

      <div className="memory-list">
        {memories.length === 0 && (
          <div className="empty-state">
            <p>No hay memorias cargadas. Hacé clic en Actualizar.</p>
          </div>
        )}
        {memories.map((m) => (
          <div key={m.memoryId} className="memory-card">
            <div className="memory-card-header">
              <span className={`badge badge-status-${m.status}`}>{m.status}</span>
              <span className="memory-scope">{m.scope}</span>
              <code className="memory-id muted">{m.memoryId.slice(0, 8)}…</code>
              <a
                href={BRAGA_EXPLORER_ENTITY_URL(m.key)}
                target="_blank"
                rel="noopener noreferrer"
                className="memory-explorer-link"
                title="Ver en Arkiv Explorer"
              >
                ↗ Arkiv
              </a>
              <button
                className="memory-delete-btn"
                title="Borrar memoria"
                disabled={deletingKey === m.key}
                onClick={() => handleDelete(m.key)}
              >
                {deletingKey === m.key ? "…" : "✕"}
              </button>
            </div>
            <p className="memory-content">{m.content}</p>
            <div className="memory-scores">
              <span>importance <strong>{m.importanceScore}</strong></span>
              <span>utility <strong>{m.utilityScore}</strong></span>
              <span>citations <strong>{m.citationCount}</strong></span>
              <span className="muted">{m.memoryType}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
