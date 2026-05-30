import { eq } from "@arkiv-network/sdk/query";

import { createArkivEntity, extendArkivEntity, queryArkivEntities, readAttr } from "@/lib/arkiv/repo";
import {
  citationAttrs,
  decayEventAttrs,
  memoryEntryAttrs,
  reinforcementEventAttrs,
  TTL,
} from "@/lib/arkiv/entities";
import {
  computeUtilityScore,
  recencyBoost,
  shouldPromote,
  shouldReinforce,
  nextScope,
  type HumanFeedback,
} from "@/lib/memory/scoring";

// ─── Create a new memory entry ───────────────────────────────────────────────

export async function createMemoryEntry(opts: {
  memoryId: string;
  agentId: string;
  userId: string;
  scope: "run" | "entity" | "global" | "shared";
  memoryType: string;
  importanceScore: number;
  content: string;
  tags?: string[];
}) {
  const attrs = memoryEntryAttrs({
    memoryId: opts.memoryId,
    agentId: opts.agentId,
    userId: opts.userId,
    scope: opts.scope,
    memoryType: opts.memoryType,
    importanceScore: opts.importanceScore,
  });

  const ttl = opts.scope === "run" ? TTL.HOUR_1 : opts.scope === "entity" ? TTL.DAY_7 : TTL.DAY_365;

  return createArkivEntity({
    payload: { content: opts.content, tags: opts.tags ?? [] },
    attributes: attrs,
    ttl,
  });
}

// ─── Record that a memory was cited in a decision ────────────────────────────

export async function recordCitation(opts: {
  citationId: string;
  memoryId: string;
  decisionId: string;
  agentId: string;
  citationScore: number;
}) {
  return createArkivEntity({
    payload: { citationId: opts.citationId },
    attributes: citationAttrs(opts),
    ttl: TTL.DAY_180,
  });
}

// ─── Reinforce a memory (extend TTL + write event) ───────────────────────────

export async function reinforceMemory(opts: {
  memoryKey: string;
  memoryId: string;
  decisionId: string;
  agentId: string;
  citationScore: number;
  humanFeedback: HumanFeedback;
  lastUsedAt: number;
  citationCount: number;
  currentScope: "run" | "entity" | "global" | "shared";
}) {
  const boost = recencyBoost(opts.lastUsedAt);
  const utilityScore = computeUtilityScore({
    citationScore: opts.citationScore,
    humanFeedback: opts.humanFeedback,
    recencyBoost: boost,
    contradictionPenalty: 0,
  });

  if (!shouldReinforce(utilityScore)) return null;

  const shouldPromoteScope = shouldPromote(opts.citationCount, opts.humanFeedback);
  const newStatus = shouldPromoteScope ? "reinforced" : "active";
  const reason = shouldPromoteScope
    ? `Promoted: citationCount=${opts.citationCount}, feedback=${opts.humanFeedback}`
    : `Reinforced: utilityScore=${utilityScore}`;

  await extendArkivEntity(opts.memoryKey, TTL.DAY_7);

  await createArkivEntity({
    payload: { reason, utilityScore },
    attributes: reinforcementEventAttrs({
      memoryId: opts.memoryId,
      decisionId: opts.decisionId,
      reason,
      deltaScore: utilityScore,
      newStatus,
    }),
    ttl: TTL.DAY_180,
  });

  return { utilityScore, newStatus, promoted: shouldPromoteScope };
}

// ─── Mark a memory as decayed ────────────────────────────────────────────────

export async function recordDecay(opts: {
  memoryId: string;
  reason: string;
  previousStatus: string;
}) {
  return createArkivEntity({
    payload: { reason: opts.reason },
    attributes: decayEventAttrs(opts),
    ttl: TTL.DAY_90,
  });
}

// ─── Fetch citations for a decision ──────────────────────────────────────────

export async function fetchCitationsForDecision(decisionId: string) {
  const entities = await queryArkivEntities({
    entityType: "citation",
    extra: [eq("decisionId", decisionId)],
  });

  return entities.map((e) => ({
    key: e.key,
    citationId: String(readAttr(e, "citationId") ?? ""),
    memoryId: String(readAttr(e, "memoryId") ?? ""),
    decisionId: String(readAttr(e, "decisionId") ?? ""),
    citationScore: Number(readAttr(e, "citationScore") ?? 0),
    createdAt: Number(readAttr(e, "createdAt") ?? 0),
  }));
}
