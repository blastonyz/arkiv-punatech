import { ZodError } from "zod";

import { createActivity, fetchActivities } from "@/lib/arkiv-client/activity";
import { PROJECT_ATTRIBUTE, trustedCreatorAddress } from "@/lib/arkiv-client/client";
import { isWriterConfigured } from "@/lib/arkiv-client/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activities = await fetchActivities({
    category: searchParams.get("category"),
    window: searchParams.get("window"),
    seed: searchParams.get("seed"),
  });

  return Response.json({
    activities,
    projectAttribute: PROJECT_ATTRIBUTE.value,
    trustedCreatorAddress,
    writerConfigured: isWriterConfigured,
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await createActivity(payload);

    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid activity payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unexpected Arkiv error.";

    return Response.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}