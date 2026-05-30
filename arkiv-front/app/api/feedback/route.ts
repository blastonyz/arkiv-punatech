/**
 * POST /api/feedback
 * Records which agent response the user preferred.
 * Creates a reinforcementEvent on Arkiv and bumps utilityScore
 * for memories that guided the winning response.
 */

import { randomUUID } from "crypto";
import { ZodError, z } from "zod";

import { createArkivEntity } from "@/lib/arkiv/repo";
import { reinforcementEventAttrs, TTL } from "@/lib/arkiv/entities";
import { reinforceMemory } from "@/lib/memory/lifecycle";
import { fetchActiveMemories, selectRelevantMemories } from "@/lib/memory/retrieval";
import { agentWalletAddress } from "@/lib/arkiv/client";

export const dynamic = "force-dynamic";

const feedbackSchema = z.object({
  decisionId: z.string(),
  sessionId: z.string(),
  winner: z.enum(["precise", "creative"]), // which response was preferred
  agentId: z.string().optional(),
  userId: z.string().optional(),
  citedMemoryIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { decisionId, sessionId, winner, agentId: rawAgent, userId: rawUser, citedMemoryIds } =
      feedbackSchema.parse(body);

    const agentId = rawAgent ?? "memoryforge-default";
    const userId = rawUser ?? agentWalletAddress ?? "anonymous";

    // 1. Create reinforcementEvent on Arkiv
    const reinforcementId = randomUUID();
    await createArkivEntity({
      payload: {
        winner,
        decisionId,
        sessionId,
        feedback: "confirmed",
        reinforcementType: "human-preference",
        reinforcementId,
      },
      attributes: reinforcementEventAttrs({
        memoryId: citedMemoryIds?.[0] ?? "none",
        decisionId,
        reason: `human-preference:${winner}`,
        deltaScore: winner === "precise" ? 10 : 5,
        newStatus: "active",
      }),
      ttl: TTL.DAY_365,
    });

    // 2. Reinforce cited memories with "confirmed" feedback
    if (citedMemoryIds && citedMemoryIds.length > 0) {
      const allMemories = await fetchActiveMemories({ agentId, userId }).catch(() => []);
      const toReinforce = allMemories.filter((m) => citedMemoryIds.includes(m.memoryId));
      const relevant = selectRelevantMemories(toReinforce, toReinforce.length);

      await Promise.all(
        relevant.map((mem) =>
          reinforceMemory({
            memoryKey: mem.key,
            memoryId: mem.memoryId,
            decisionId,
            agentId,
            citationScore: 90,
            humanFeedback: "confirmed",
            lastUsedAt: mem.lastUsedAt,
            citationCount: mem.citationCount,
            currentScope: mem.scope as "run" | "entity" | "global" | "shared",
          }).catch(() => null),
        ),
      );
    }

    return Response.json({ ok: true, reinforcementId, winner });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
