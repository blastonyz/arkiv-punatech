import { createHash } from "crypto";

import { createArkivEntity, queryArkivEntities, readAttr } from "@/lib/arkiv/repo";
import { auditSnapshotAttrs, TTL } from "@/lib/arkiv/entities";

export type SnapshotPayload = {
  sessionId: string;
  decisionId: string;
  inputHash: string;
  outputHash: string;
  citedMemoryIds: string[];
  timestamp: number;
  [key: string]: unknown;
};

export function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function computeCommitHash(prevHash: string, payload: SnapshotPayload): string {
  return sha256(prevHash + JSON.stringify(payload));
}

export function hashText(text: string): string {
  return sha256(text);
}

export async function createAuditSnapshot(opts: {
  snapshotId: string;
  sessionId: string;
  decisionId: string;
  commitSeq: number;
  prevHash: string;
  payload: SnapshotPayload;
}) {
  const commitHash = computeCommitHash(opts.prevHash, opts.payload);

  await createArkivEntity({
    payload: opts.payload,
    attributes: auditSnapshotAttrs({
      snapshotId: opts.snapshotId,
      sessionId: opts.sessionId,
      prevHash: opts.prevHash,
      commitHash,
      commitSeq: opts.commitSeq,
      decisionId: opts.decisionId,
    }),
    ttl: TTL.DAY_365,
  });

  return { commitHash };
}

export type AuditSnapshot = {
  key: string;
  snapshotId: string;
  sessionId: string;
  decisionId: string;
  prevHash: string;
  commitHash: string;
  commitSeq: number;
  createdAt: number;
};

export async function fetchSnapshotChain(sessionId: string): Promise<AuditSnapshot[]> {
  const { eq } = await import("@arkiv-network/sdk/query");

  const entities = await queryArkivEntities({
    entityType: "auditSnapshot",
    extra: [eq("sessionId", sessionId)],
    limit: 100,
  });

  return entities
    .map((e) => ({
      key: e.key,
      snapshotId: String(readAttr(e, "snapshotId") ?? ""),
      sessionId: String(readAttr(e, "sessionId") ?? ""),
      decisionId: String(readAttr(e, "decisionId") ?? ""),
      prevHash: String(readAttr(e, "prevHash") ?? ""),
      commitHash: String(readAttr(e, "commitHash") ?? ""),
      commitSeq: Number(readAttr(e, "commitSeq") ?? 0),
      createdAt: Number(readAttr(e, "createdAt") ?? 0),
    }))
    .sort((a, b) => a.commitSeq - b.commitSeq);
}
