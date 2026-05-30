import { randomUUID } from "crypto";
import { ZodError, z } from "zod";

import { callDualAgents, extractFacts, getEmbedding } from "@/lib/agent/vertex";
import { createArkivEntity } from "@/lib/arkiv/repo";
import { decisionAttrs, sessionAttrs, messageAttrs, memoryEntryAttrs, TTL } from "@/lib/arkiv/entities";
import { fetchActiveMemories, semanticRerank, formatMemoriesForPrompt } from "@/lib/memory/retrieval";
import { fetchSessionHistory, toGeminiHistory } from "@/lib/memory/history";
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

    // 1. Fetch memories + query embedding + session history in parallel
    const [allMemories, queryEmbedding, sessionMessages] = await Promise.all([
      fetchActiveMemories({ agentId, userId }).catch(() => []),
      getEmbedding(message).catch(() => [] as number[]),
      rawSession ? fetchSessionHistory(rawSession, 20).catch(() => []) : Promise.resolve([]),
    ]);

    // 2. Semantic reranking
    const memoryEmbeddings = new Map<string, number[]>();
    if (queryEmbedding.length > 0 && allMemories.length > 0) {
      await Promise.all(
        allMemories.map(async (m) => {
          const emb = await getEmbedding(m.content).catch(() => [] as number[]);
          if (emb.length > 0) memoryEmbeddings.set(m.memoryId, emb);
        }),
      );
    }

    const relevant = semanticRerank(allMemories, queryEmbedding, memoryEmbeddings, 5);
    const memoryContext = formatMemoriesForPrompt(relevant);

    // 3. Build conversation history from Arkiv (only "agent" role = "precise" messages)
    const history = toGeminiHistory(
      sessionMessages.filter((m) => m.role === "user" || m.role === "agent"),
    );

    // 4. Dual-agent call with full history context
    const { precise, creative } = await callDualAgents({
      text: message,
      sessionId,
      memoryContext,
      history,
    });

    // 5. Write to Arkiv + auto-extract facts (fire-and-forget)
    const arkivWrites = async () => {
      try {
        await createArkivEntity({
          payload: { sessionId },
          attributes: sessionAttrs(sessionId, agentId, userId),
          ttl: TTL.HOUR_12,
        });

        await createArkivEntity({
          payload: { text: message },
          attributes: messageAttrs(sessionId, agentId, "user", seq),
          ttl: TTL.HOUR_12,
        });

        await createArkivEntity({
          payload: { text: precise, agentMode: "precise" },
          attributes: messageAttrs(sessionId, agentId, "agent", seq + 1),
          ttl: TTL.HOUR_12,
        });

        await createArkivEntity({
          payload: { text: creative, agentMode: "creative" },
          attributes: messageAttrs(sessionId, agentId, "agent", seq + 2),
          ttl: TTL.HOUR_12,
        });

        await createArkivEntity({
          payload: { inputHash: hashText(message), outputHash: hashText(precise) },
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

        // Auto-extract facts from this turn and persist as memoryEntry
        const facts = await extractFacts(message, precise).catch(() => []);
        for (const fact of facts) {
          await createArkivEntity({
            payload: { content: fact.content },
            attributes: memoryEntryAttrs({
              memoryId: randomUUID(),
              agentId,
              userId,
              scope: "entity",
              memoryType: fact.memoryType,
              importanceScore: fact.importanceScore,
            }),
            ttl: TTL.DAY_7,
          });
        }

        // Citations + reinforcement
        for (const mem of relevant) {
          const citationId = randomUUID();
          const citationScore = Math.round(50 + (mem.utilityScore / 100) * 50);
          await recordCitation({ citationId, memoryId: mem.memoryId, decisionId, agentId, citationScore });
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
            outputHash: hashText(precise),
            citedMemoryIds: relevant.map((m) => m.memoryId),
            autoExtractedFacts: facts.length,
            historyTurns: sessionMessages.length,
            timestamp: Date.now(),
          },
        });
      } catch {
        // non-blocking
      }
    };

    arkivWrites();

    return Response.json({
      precise,
      creative,
      sessionId,
      decisionId,
      historyLength: sessionMessages.length,
      citedMemories: relevant.map((m) => ({ memoryId: m.memoryId, content: m.content })),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
