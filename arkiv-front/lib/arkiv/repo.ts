import { eq, gt } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

import { PROJECT_ATTRIBUTE } from "@/lib/arkiv/project";
import { getWalletClient, publicClient } from "@/lib/arkiv/client";

type Attr = { key: string; value: string | number };

// ─── Write ───────────────────────────────────────────────────────────────────

export async function createArkivEntity(opts: {
  payload: Record<string, unknown>;
  attributes: Attr[];
  ttl: ReturnType<typeof ExpirationTime.fromHours>;
}) {
  const writer = getWalletClient();
  if (!writer) throw new Error("Writer wallet not configured. Set BRAGA_PK in .env.");

  return writer.createEntity({
    payload: jsonToPayload(opts.payload),
    contentType: "application/json",
    attributes: opts.attributes,
    expiresIn: opts.ttl,
  });
}

export async function extendArkivEntity(
  key: string,
  ttl: ReturnType<typeof ExpirationTime.fromHours>,
) {
  const writer = getWalletClient();
  if (!writer) throw new Error("Writer wallet not configured.");
  return writer.extendEntity({ entityKey: key as `0x${string}`, expiresIn: ttl });
}

// ─── Read ────────────────────────────────────────────────────────────────────

type QueryOpts = {
  entityType: string;
  extra?: Array<ReturnType<typeof eq> | ReturnType<typeof gt>>;
  limit?: number;
  createdBy?: string | null;
  since?: number;
};

export async function queryArkivEntities(opts: QueryOpts) {
  const conditions = [
    eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
    eq("entityType", opts.entityType),
  ];

  if (opts.since !== undefined) {
    conditions.push(gt("createdAt", opts.since));
  }

  if (opts.extra) {
    conditions.push(...opts.extra);
  }

  let query = publicClient
    .buildQuery()
    .where(conditions)
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(opts.limit ?? 50);

  if (opts.createdBy) {
    query = query.createdBy(opts.createdBy as `0x${string}`);
  }

  const result = await query.fetch();
  return result.entities as Array<{
    key: string;
    toJson: () => unknown;
    attributes?: Array<{ key: string; value: string | number }>;
    metadata?: { creator?: string };
  }>;
}

export function readAttr(
  entity: { attributes?: Array<{ key: string; value: string | number }> },
  key: string,
): string | number | null {
  return entity.attributes?.find((a) => a.key === key)?.value ?? null;
}
