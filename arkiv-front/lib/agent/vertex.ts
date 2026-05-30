/**
 * Vertex AI Agent Platform (Dialogflow CX) client.
 * Authenticates via API key — set GOOGLE_API_KEY in .env.
 *
 * Agent endpoint:
 *   POST https://{LOCATION}-dialogflow.googleapis.com/v3/projects/{PROJECT}/locations/{LOCATION}/agents/{AGENT_ID}/sessions/{SESSION_ID}:detectIntent
 */

const BASE = "https://dialogflow.googleapis.com/v3";

function agentEnv() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const agentId = process.env.VERTEX_AGENT_ID;
  const location = process.env.VERTEX_AGENT_LOCATION ?? "southamerica-east1";
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!projectId || !agentId || !apiKey) {
    throw new Error(
      "Missing Vertex AI config. Set GOOGLE_CLOUD_PROJECT_ID, VERTEX_AGENT_ID and GOOGLE_API_KEY in .env.",
    );
  }

  return { projectId, agentId, location, apiKey };
}

function sessionPath(projectId: string, location: string, agentId: string, sessionId: string) {
  const base =
    location === "global"
      ? BASE
      : `https://${location}-dialogflow.googleapis.com/v3`;

  return `${base}/projects/${projectId}/locations/${location}/agents/${agentId}/sessions/${sessionId}:detectIntent`;
}

export type AgentTurn = {
  text: string;
  sessionId: string;
  memoryContext?: string; // formatted memories prepended as context
};

export type AgentResponse = {
  reply: string;
  rawResponse: unknown;
};

export async function callVertexAgent(turn: AgentTurn): Promise<AgentResponse> {
  const { projectId, agentId, location, apiKey } = agentEnv();

  const queryText = turn.memoryContext
    ? `${turn.memoryContext}\n\n---\nUser: ${turn.text}`
    : turn.text;

  const url = `${sessionPath(projectId, location, agentId, turn.sessionId)}?key=${encodeURIComponent(apiKey)}`;

  const body = {
    queryInput: {
      text: { text: queryText },
      languageCode: "es",
    },
    queryParams: {
      timeZone: "America/Argentina/Buenos_Aires",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vertex AI Agent error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    queryResult?: {
      responseMessages?: Array<{ text?: { text?: string[] } }>;
    };
  };

  const reply =
    data.queryResult?.responseMessages
      ?.flatMap((m) => m.text?.text ?? [])
      .join("\n")
      .trim() ?? "(sin respuesta)";

  return { reply, rawResponse: data };
}
