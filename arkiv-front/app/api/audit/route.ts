import { fetchSnapshotChain } from "@/lib/audit/hashchain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const chain = await fetchSnapshotChain(sessionId);
    return Response.json({ chain });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
