"use client";

import { useState, useRef, useTransition, useEffect } from "react";

type DualReply = {
  precise: string;
  creative: string;
  decisionId: string;
  citedMemories: Array<{ memoryId: string; content: string }>;
  feedbackGiven?: "precise" | "creative";
  historyLength?: number;
};

type Message =
  | { role: "user"; text: string }
  | { role: "agent"; dual: DualReply };

type AgentChatProps = {
  agentId?: string;
  userId?: string;
};

export function AgentChat({ agentId, userId }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userText = input.trim();
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user" as const, text: userText }]);

    startTransition(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            sessionId: sessionId ?? undefined,
            agentId,
            userId,
          }),
        });

        const data = (await res.json()) as {
          precise?: string;
          creative?: string;
          sessionId?: string;
          decisionId?: string;
          historyLength?: number;
          citedMemories?: Array<{ memoryId: string; content: string }>;
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? "Error al contactar el agente.");
          return;
        }

        if (data.sessionId && !sessionId) setSessionId(data.sessionId);

        setMessages((prev) => [
          ...prev,
          {
            role: "agent" as const,
            dual: {
              precise: data.precise ?? "(sin respuesta)",
              creative: data.creative ?? "(sin respuesta)",
              decisionId: data.decisionId ?? "",
              citedMemories: data.citedMemories ?? [],
              historyLength: data.historyLength ?? 0,
            },
          },
        ]);
      } catch {
        setError("Error de red al contactar el agente.");
      }
    });
  }

  async function handleFeedback(msgIdx: number, winner: "precise" | "creative") {
    const msg = messages[msgIdx];
    if (msg.role !== "agent") return;

    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || m.role !== "agent") return m;
        return { ...m, dual: { ...m.dual, feedbackGiven: winner } };
      }),
    );

    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisionId: msg.dual.decisionId,
        sessionId: sessionId ?? "",
        winner,
        agentId,
        userId,
        citedMemoryIds: msg.dual.citedMemories.map((m) => m.memoryId),
      }),
    }).catch(() => null);
  }

  return (
    <div className="agent-chat">
      <div className="dual-agents-header">
        <div className="dual-agents-label">
          <span className="dual-badge precise">Agente Preciso · 0.2</span>
          <span className="dual-agents-sep">vs</span>
          <span className="dual-badge creative">Agente Creativo · 1.8</span>
        </div>
        {sessionId && (
          <code className="session-id-display">sesión {sessionId.slice(0, 10)}…</code>
        )}
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Enviá un mensaje para ver ambos agentes responder en paralelo.</p>
        )}
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="chat-bubble chat-bubble-user">
                <span className="bubble-label">Vos</span>
                <p>{msg.text}</p>
              </div>
            );
          }

          const { dual } = msg;
          return (
            <div key={i} className="dual-response">
              {dual.historyLength != null && dual.historyLength > 0 && (
                <div className="history-badge">
                  <span>🔗 {dual.historyLength} turnos recuperados de Arkiv</span>
                </div>
              )}

              <div className={`dual-card dual-precise${dual.feedbackGiven === "precise" ? " dual-winner" : ""}`}>
                <div className="dual-header">
                  <span className="dual-badge precise">Preciso · temp 0.2</span>
                  {!dual.feedbackGiven && (
                    <button className="feedback-btn" onClick={() => handleFeedback(i, "precise")}>
                      👍 Mejor
                    </button>
                  )}
                  {dual.feedbackGiven === "precise" && <span className="winner-badge">✓ Elegida</span>}
                </div>
                <p>{dual.precise}</p>
              </div>

              <div className={`dual-card dual-creative${dual.feedbackGiven === "creative" ? " dual-winner" : ""}`}>
                <div className="dual-header">
                  <span className="dual-badge creative">Creativo · temp 1.8</span>
                  {!dual.feedbackGiven && (
                    <button className="feedback-btn" onClick={() => handleFeedback(i, "creative")}>
                      👍 Mejor
                    </button>
                  )}
                  {dual.feedbackGiven === "creative" && <span className="winner-badge">✓ Elegida</span>}
                </div>
                <p>{dual.creative}</p>
              </div>

              {dual.citedMemories.length > 0 && (
                <div className="cited-memories">
                  <span className="eyebrow">Memorias activas citadas</span>
                  {dual.citedMemories.map((m) => (
                    <div key={m.memoryId} className="cited-memory-item">
                      <code className="memory-id">{m.memoryId.slice(0, 8)}&hellip;</code>
                      <span>{m.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="form-message form-message-error">{error}</p>}

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu mensaje…"
          disabled={isPending}
          maxLength={2000}
        />
        <button type="submit" disabled={isPending || !input.trim()}>
          {isPending ? "…" : "Enviar"}
        </button>
      </form>

      {sessionId && (
        <p className="session-id muted">
          Sesión: <code>{sessionId}</code>
        </p>
      )}
    </div>
  );
}
