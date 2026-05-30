import { randomUUID } from "crypto";
import { ZodError, z } from "zod";

import { createMemoryEntry } from "@/lib/memory/lifecycle";
import { fetchActiveMemories } from "@/lib/memory/retrieval";
import { agentWalletAddress } from "@/lib/arkiv/client";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  content: z.string().trim().min(2).max(1000),
  memoryType: z.string().default("general"),
  scope: z.enum(["run", "entity", "global", "shared"]).default("entity"),
  importanceScore: z.number().int().min(0).max(100).default(50),
  tags: z.array(z.string()).optional(),
  agentId: z.string().optional(),
  userId: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? "memoryforge-default";
  const userId = searchParams.get("userId") ?? undefined;
  const scope = searchParams.get("scope") ?? undefined;

  try {
    const memories = await fetchActiveMemories({ agentId, userId, scope });
    return Response.json({ memories });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const agentId = data.agentId ?? "memoryforge-default";
    const userId = data.userId ?? agentWalletAddress ?? "anonymous";
    const memoryId = randomUUID();

    await createMemoryEntry({
      memoryId,
      agentId,
      userId,
      scope: data.scope,
      memoryType: data.memoryType,
      importanceScore: data.importanceScore,
      content: data.content,
      tags: data.tags,
    });

    return Response.json({ memoryId, status: "created" }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid payload", issues: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
