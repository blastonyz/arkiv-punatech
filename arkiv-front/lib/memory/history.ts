/**
 * Fetch conversation history from Arkiv for a given sessionId.
 * Reconstructs the multi-turn context so the agent remembers across reloads.
 */

import { eq } from "@arkiv-network/sdk/query";
import { z } from "zod";

import { queryArkivEntities, readAttr } from "@/lib/arkiv/repo";
import type { HistoryTurn } from "@/lib/agent/vertex";

const messagePayloadSchema = z.object({
  text: z.string(),
});

export type SessionMessage = {
  role: "user" | "agent";
  text: string;
  seq: number;
};

/** Fetch up to `limit` messages for a session, sorted by seq ascending */
export async function fetchSessionHistory(
  sessionId: string,
  limit = 20,
): Promise<SessionMessage[]> {
  const entities = await queryArkivEntities({
    entityType: "message",
    extra: [eq("sessionId", sessionId)],
    limit,
  });

  return entities
    .flatMap((e) => {
      try {
        const payload = messagePayloadSchema.parse(e.toJson());
        const role = String(readAttr(e, "role") ?? "user") as "user" | "agent";
        const seq = Number(readAttr(e, "seq") ?? 0);
        return [{ role, text: payload.text, seq }];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.seq - b.seq);
}

/** Convert session messages to Gemini multi-turn history format */
export function toGeminiHistory(messages: SessionMessage[]): HistoryTurn[] {
  return messages.map((m) => ({
    role: m.role === "agent" ? "model" : "user",
    text: m.text,
  }));
}
