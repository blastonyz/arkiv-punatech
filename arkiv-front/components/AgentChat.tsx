"use client";

import { useState, useRef, useTransition, useEffect } from "react";

type Message = {
  role: "user" | "agent";
  text: string;
  citedMemories?: Array<{ memoryId: string; content: string }>;
};

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
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

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
          reply?: string;
          sessionId?: string;
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
            role: "agent",
            text: data.reply ?? "(sin respuesta)",
            citedMemories: data.citedMemories,
          },
        ]);
      } catch {
        setError("Error de red al contactar el agente.");
      }
    });
  }

  return (
    <div className="agent-chat">
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Enviá un mensaje para iniciar una sesión con el agente.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble-${msg.role}`}>
            <span className="bubble-label">{msg.role === "user" ? "Vos" : "Agente"}</span>
            <p>{msg.text}</p>
            {msg.citedMemories && msg.citedMemories.length > 0 && (
              <div className="cited-memories">
                <span className="eyebrow">Memorias citadas</span>
                {msg.citedMemories.map((m) => (
                  <div key={m.memoryId} className="cited-memory-item">
                    <code className="memory-id">{m.memoryId.slice(0, 8)}…</code>
                    <span>{m.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="form-message form-message-error">{error}</p>}

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu mensaje..."
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
