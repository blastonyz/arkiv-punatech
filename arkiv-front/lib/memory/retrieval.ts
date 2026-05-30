import { eq } from "@arkiv-network/sdk/query";
import { z } from "zod";

import { queryArkivEntities, readAttr } from "@/lib/arkiv/repo";

export const memoryEntrySchema = z.object({
  content: z.string(),
  memoryType: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type MemoryEntry = {
  key: string;
  memoryId: string;
  agentId: string;
  userId: string;
  scope: string;
  memoryType: string;
  status: string;
  importanceScore: number;
  utilityScore: number;
  citationCount: number;
  createdAt: number;
  lastUsedAt: number;
  content: string;
};

export async function fetchActiveMemories(opts: {
  agentId: string;
  userId?: string;
  scope?: string;
  limit?: number;
}): Promise<MemoryEntry[]> {
  const extra = [
    eq("agentId", opts.agentId),
    eq("status", "active"),
  ];

  if (opts.userId) extra.push(eq("userId", opts.userId));
  if (opts.scope) extra.push(eq("scope", opts.scope));

  const entities = await queryArkivEntities({
    entityType: "memoryEntry",
    extra,
    limit: opts.limit ?? 20,
  });

  return entities.flatMap((e) => {
    try {
      const payload = memoryEntrySchema.parse(e.toJson());
      return [
        {
          key: e.key,
          memoryId: String(readAttr(e, "memoryId") ?? ""),
          agentId: String(readAttr(e, "agentId") ?? ""),
          userId: String(readAttr(e, "userId") ?? ""),
          scope: String(readAttr(e, "scope") ?? "run"),
          memoryType: String(readAttr(e, "memoryType") ?? "general"),
          status: String(readAttr(e, "status") ?? "active"),
          importanceScore: Number(readAttr(e, "importanceScore") ?? 0),
          utilityScore: Number(readAttr(e, "utilityScore") ?? 0),
          citationCount: Number(readAttr(e, "citationCount") ?? 0),
          createdAt: Number(readAttr(e, "createdAt") ?? 0),
          lastUsedAt: Number(readAttr(e, "lastUsedAt") ?? 0),
          content: payload.content,
        } satisfies MemoryEntry,
      ];
    } catch {
      return [];
    }
  });
}

/** Pick the top-N most relevant memories for a prompt (by utilityScore + importanceScore) */
export function selectRelevantMemories(
  memories: MemoryEntry[],
  limit = 5,
): MemoryEntry[] {
  return [...memories]
    .sort((a, b) => b.utilityScore + b.importanceScore - (a.utilityScore + a.importanceScore))
    .slice(0, limit);
}

/** Format memories as a context block for the LLM prompt */
export function formatMemoriesForPrompt(memories: MemoryEntry[]): string {
  if (memories.length === 0) return "";
  const lines = memories.map(
    (m, i) =>
      `[Memory ${i + 1}] (id:${m.memoryId}, type:${m.memoryType}, scope:${m.scope})\n${m.content}`,
  );
  return `## Active agent memories\n${lines.join("\n\n")}`;
}
