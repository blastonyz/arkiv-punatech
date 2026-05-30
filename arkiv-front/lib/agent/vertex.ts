/**
 * Gemini API client (Google AI Studio).
 * - Text generation: gemini-2.0-flash (dual-agent: precise + creative, multi-turn)
 * - Embeddings: text-embedding-004 for semantic memory retrieval
 * - Fact extraction: auto-extract memories from conversations
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_PROMPT = `Sos un agente de IA llamado MemoryForge, especializado en gestión de memoria evolutiva on-chain sobre la red Arkiv.
Respondés en español rioplatense, de forma concisa y útil.
Cuando recibís contexto de memoria previo (marcado con [MEMORIA ACTIVA]), lo tenés en cuenta para personalizar tu respuesta.
Cuando el historial de conversación incluye turnos previos, los usás como contexto continuo.`;

export type HistoryTurn = {
  role: "user" | "model";
  text: string;
};

export type AgentTurn = {
  text: string;
  sessionId: string;
  memoryContext?: string;
  history?: HistoryTurn[];
};

export type AgentResponse = {
  reply: string;
  rawResponse: unknown;
};

export type DualAgentResponse = {
  precise: string;   // temperature 0.2 — factual, concise
  creative: string;  // temperature 1.8 — hallucination-prone, divergent
  sessionId: string;
};

export type ExtractedFact = {
  content: string;
  memoryType: "fact" | "preference" | "goal" | "context";
  importanceScore: number; // 0-100
};

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env");
  return key;
}

function buildContents(
  prompt: string,
  history: HistoryTurn[] = [],
): Array<{ role: string; parts: Array<{ text: string }> }> {
  const historyContents = history.map((h) => ({
    role: h.role,
    parts: [{ text: h.text }],
  }));
  return [...historyContents, { role: "user", parts: [{ text: prompt }] }];
}

async function generateContent(
  prompt: string,
  temperature: number,
  history: HistoryTurn[] = [],
): Promise<string> {
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: buildContents(prompt, history),
    generationConfig: { temperature, maxOutputTokens: 1024 },
  };

  const res = await fetch(
    `${GEMINI_BASE}/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey())}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ??
    "(sin respuesta)"
  );
}

// â”€â”€â”€ public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Single-agent call (backwards compat) */
export async function callVertexAgent(turn: AgentTurn): Promise<AgentResponse> {
  const prompt = turn.memoryContext
    ? `[MEMORIA ACTIVA]\n${turn.memoryContext}\n\n---\n${turn.text}`
    : turn.text;

  const reply = await generateContent(prompt, 0.7, turn.history);
  return { reply, rawResponse: null };
}

/** Dual-agent call: precise (0.2) + creative (0.9) in parallel, with history */
export async function callDualAgents(turn: AgentTurn): Promise<DualAgentResponse> {
  const prompt = turn.memoryContext
    ? `[MEMORIA ACTIVA]\n${turn.memoryContext}\n\n---\n${turn.text}`
    : turn.text;

  const [precise, creative] = await Promise.all([
    generateContent(prompt, 0.2, turn.history),
    generateContent(prompt, 1.8, turn.history),
  ]);

  return { precise, creative, sessionId: turn.sessionId };
}

/** Get embedding vector for semantic memory retrieval */
export async function getEmbedding(text: string): Promise<number[]> {
  const body = {
    model: "models/text-embedding-004",
    content: { parts: [{ text }] },
    taskType: "RETRIEVAL_QUERY",
  };

  const res = await fetch(
    `${GEMINI_BASE}/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey())}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );

  if (!res.ok) throw new Error(`Embedding error ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { embedding?: { values?: number[] } };
  return data.embedding?.values ?? [];
}

/**
 * Extract memorable facts from a conversation turn.
 * Returns an array of facts to persist as memoryEntry in Arkiv.
 * Fire-and-forget safe â€” returns [] on error.
 */
export async function extractFacts(
  userMessage: string,
  agentReply: string,
): Promise<ExtractedFact[]> {
  const extractPrompt = `Analizá este intercambio entre un usuario y un agente de IA.
Extraé entre 0 y 3 hechos importantes que valga la pena recordar a largo plazo.
Solo extraé hechos concretos — preferencias, objetivos, contexto personal, datos técnicos relevantes.
No extraigas cosas genéricas o triviales.

Intercambio:
Usuario: ${userMessage}
Agente: ${agentReply}

Respondé ÚNICAMENTE con un JSON array (sin markdown, sin texto extra):
[
  { "content": "...", "memoryType": "fact|preference|goal|context", "importanceScore": 0-100 },
  ...
]
Si no hay nada relevante, respondé: []`;

  try {
    const raw = await generateContent(extractPrompt, 0.1);
    // strip possible markdown fences
    const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(json) as ExtractedFact[];
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}
