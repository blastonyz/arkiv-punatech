import { ExpirationTime } from "@arkiv-network/sdk/utils";

import { PROJECT_ATTRIBUTE } from "@/lib/arkiv/project";

// ─── TTL presets ────────────────────────────────────────────────────────────
export const TTL = {
  HOUR_1: ExpirationTime.fromHours(1),
  HOUR_12: ExpirationTime.fromHours(12),
  HOUR_24: ExpirationTime.fromHours(24),
  DAY_7: ExpirationTime.fromHours(24 * 7),
  DAY_90: ExpirationTime.fromHours(24 * 90),
  DAY_180: ExpirationTime.fromHours(24 * 180),
  DAY_365: ExpirationTime.fromHours(24 * 365),
};

type Attr = { key: string; value: string | number };

function base(entityType: string): Attr[] {
  return [PROJECT_ATTRIBUTE, { key: "entityType", value: entityType }];
}

// ─── Entity attribute builders ───────────────────────────────────────────────

export function agentProfileAttrs(agentId: string, owner: string): Attr[] {
  const now = Date.now();
  return [
    ...base("agentProfile"),
    { key: "agentId", value: agentId },
    { key: "owner", value: owner },
    { key: "status", value: "active" },
    { key: "createdAt", value: now },
    { key: "updatedAt", value: now },
  ];
}

export function sessionAttrs(sessionId: string, agentId: string, userId: string): Attr[] {
  const now = Date.now();
  return [
    ...base("session"),
    { key: "sessionId", value: sessionId },
    { key: "agentId", value: agentId },
    { key: "userId", value: userId },
    { key: "startedAt", value: now },
    { key: "lastActivityAt", value: now },
    { key: "status", value: "active" },
  ];
}

export function messageAttrs(
  sessionId: string,
  agentId: string,
  role: "user" | "agent",
  seq: number,
): Attr[] {
  return [
    ...base("message"),
    { key: "sessionId", value: sessionId },
    { key: "agentId", value: agentId },
    { key: "role", value: role },
    { key: "seq", value: seq },
    { key: "createdAt", value: Date.now() },
  ];
}

export function memoryEntryAttrs(opts: {
  memoryId: string;
  agentId: string;
  userId: string;
  scope: "run" | "entity" | "global" | "shared";
  memoryType: string;
  importanceScore: number;
}): Attr[] {
  const now = Date.now();
  return [
    ...base("memoryEntry"),
    { key: "memoryId", value: opts.memoryId },
    { key: "agentId", value: opts.agentId },
    { key: "userId", value: opts.userId },
    { key: "scope", value: opts.scope },
    { key: "memoryType", value: opts.memoryType },
    { key: "status", value: "active" },
    { key: "importanceScore", value: opts.importanceScore },
    { key: "utilityScore", value: 0 },
    { key: "citationCount", value: 0 },
    { key: "createdAt", value: now },
    { key: "lastUsedAt", value: now },
  ];
}

export function decisionAttrs(opts: {
  decisionId: string;
  sessionId: string;
  agentId: string;
  userId: string;
  decisionType: string;
  riskLevel: "low" | "medium" | "high";
}): Attr[] {
  return [
    ...base("decision"),
    { key: "decisionId", value: opts.decisionId },
    { key: "sessionId", value: opts.sessionId },
    { key: "agentId", value: opts.agentId },
    { key: "userId", value: opts.userId },
    { key: "decisionType", value: opts.decisionType },
    { key: "riskLevel", value: opts.riskLevel },
    { key: "createdAt", value: Date.now() },
  ];
}

export function citationAttrs(opts: {
  citationId: string;
  memoryId: string;
  decisionId: string;
  agentId: string;
  citationScore: number;
}): Attr[] {
  return [
    ...base("citation"),
    { key: "citationId", value: opts.citationId },
    { key: "memoryId", value: opts.memoryId },
    { key: "decisionId", value: opts.decisionId },
    { key: "agentId", value: opts.agentId },
    { key: "citationScore", value: opts.citationScore },
    { key: "createdAt", value: Date.now() },
  ];
}

export function reinforcementEventAttrs(opts: {
  memoryId: string;
  decisionId: string;
  reason: string;
  deltaScore: number;
  newStatus: string;
}): Attr[] {
  return [
    ...base("reinforcementEvent"),
    { key: "memoryId", value: opts.memoryId },
    { key: "decisionId", value: opts.decisionId },
    { key: "reason", value: opts.reason },
    { key: "deltaScore", value: opts.deltaScore },
    { key: "newStatus", value: opts.newStatus },
    { key: "createdAt", value: Date.now() },
  ];
}

export function decayEventAttrs(opts: {
  memoryId: string;
  reason: string;
  previousStatus: string;
}): Attr[] {
  return [
    ...base("decayEvent"),
    { key: "memoryId", value: opts.memoryId },
    { key: "reason", value: opts.reason },
    { key: "previousStatus", value: opts.previousStatus },
    { key: "createdAt", value: Date.now() },
  ];
}

export function accessGrantAttrs(opts: {
  grantId: string;
  resourceKey: string;
  granteeAddress: string;
  expiresAt: number;
  grantScope: string;
}): Attr[] {
  return [
    ...base("accessGrant"),
    { key: "grantId", value: opts.grantId },
    { key: "resourceKey", value: opts.resourceKey },
    { key: "granteeAddress", value: opts.granteeAddress },
    { key: "expiresAt", value: opts.expiresAt },
    { key: "grantScope", value: opts.grantScope },
    { key: "status", value: "active" },
    { key: "createdAt", value: Date.now() },
  ];
}

export function auditSnapshotAttrs(opts: {
  snapshotId: string;
  sessionId: string;
  prevHash: string;
  commitHash: string;
  commitSeq: number;
  decisionId: string;
}): Attr[] {
  return [
    ...base("auditSnapshot"),
    { key: "snapshotId", value: opts.snapshotId },
    { key: "sessionId", value: opts.sessionId },
    { key: "prevHash", value: opts.prevHash },
    { key: "commitHash", value: opts.commitHash },
    { key: "commitSeq", value: opts.commitSeq },
    { key: "decisionId", value: opts.decisionId },
    { key: "createdAt", value: Date.now() },
  ];
}
