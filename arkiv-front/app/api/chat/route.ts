import { randomUUID } from "crypto";
import { ZodError, z } from "zod";

import { callVertexAgent } from "@/lib/agent/vertex";
import { createArkivEntity } from "@/lib/arkiv/repo";
import { decisionAttrs, sessionAttrs, messageAttrs, TTL } from "@/lib/arkiv/entities";
import { fetchActiveMemories, selectRelevantMemories, formatMemoriesForPrompt } from "@/lib/memory/retrieval";
import { recordCitation, reinforceMemory } from "@/lib/memory/lifecycle";
import { createAuditSnapshot, hashText } from "@/lib/audit/hashchain";
import { agentWalletAddress } from "@/lib/arkiv/client";

export const dynamic = "force-dynamic";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().optional(),
  agentId: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId: rawSession, agentId: rawAgent, userId: rawUser } =
      chatSchema.parse(body);

    const sessionId = rawSession ?? randomUUID();
    const agentId = rawAgent ?? "memoryforge-default";
    const userId = rawUser ?? agentWalletAddress ?? "anonymous";
    const decisionId = randomUUID();
    const seq = Date.now();

    // 1. Fetch active memories
    const allMemories = await fetchActiveMemories({ agentId, userId }).catch(() => []);
    const relevant = selectRelevantMemories(allMemories, 5);
    const memoryContext = formatMemoriesForPrompt(relevant);

    // 2. Call Vertex AI agent
    const { reply } = await callVertexAgent({ text: message, sessionId, memoryContext });

    // 3. Write session + messages + decision to Arkiv (fire-and-forget, don't block reply)
    const arkivWrites = async () => {
      try {
        // Session (upsert pattern: just create; duplicates are namespaced by sessionId)
        await createArkivEntity({
          payload: { sessionId },
          attributes: sessionAttrs(sessionId, agentId, userId),
          ttl: TTL.HOUR_12,
        });

        // User message
        await createArkivEntity({
          payload: { text: message },
          attributes: messageAttrs(sessionId, agentId, "user", seq),
          ttl: TTL.HOUR_12,
        });

        // Agent message
        await createArkivEntity({
          payload: { text: reply },
          attributes: messageAttrs(sessionId, agentId, "agent", seq + 1),
          ttl: TTL.HOUR_12,
        });

        // Decision
        await createArkivEntity({
          payload: { inputHash: hashText(message), outputHash: hashText(reply) },
          attributes: decisionAttrs({
            decisionId,
            sessionId,
            agentId,
            userId,
            decisionType: "chat",
            riskLevel: "low",
          }),
          ttl: TTL.DAY_90,
        });

        // Citations + reinforcement for each cited memory
        for (const mem of relevant) {
          const citationId = randomUUID();
          const citationScore = Math.round(50 + (mem.utilityScore / 100) * 50);

          await recordCitation({
            citationId,
            memoryId: mem.memoryId,
            decisionId,
            agentId,
            citationScore,
          });

          await reinforceMemory({
            memoryKey: mem.key,
            memoryId: mem.memoryId,
            decisionId,
            agentId,
            citationScore,
            humanFeedback: "none",
            lastUsedAt: mem.lastUsedAt,
            citationCount: mem.citationCount,
            currentScope: mem.scope as "run" | "entity" | "global" | "shared",
          });
        }

        // Audit snapshot
        const prevHash = "0".repeat(64);
        await createAuditSnapshot({
          snapshotId: randomUUID(),
          sessionId,
          decisionId,
          commitSeq: seq,
          prevHash,
          payload: {
            sessionId,
            decisionId,
            inputHash: hashText(message),
            outputHash: hashText(reply),
            citedMemoryIds: relevant.map((m) => m.memoryId),
            timestamp: Date.now(),
          },
        });
      } catch {
        // non-blocking: don't fail the chat response if Arkiv writes fail
      }
    };

    arkivWrites();

    return Response.json({
      reply,
      sessionId,
      decisionId,
      citedMemories: relevant.map((m) => ({ memoryId: m.memoryId, content: m.content })),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
