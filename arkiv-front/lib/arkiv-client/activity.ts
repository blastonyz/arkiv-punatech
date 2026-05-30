import { eq, gt } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { z } from "zod";

import {
  ACTIVITY_ATTRIBUTE,
  PROJECT_ATTRIBUTE,
  getWalletClient,
  publicClient,
  trustedCreatorAddress,
} from "@/lib/arkiv-client/client";

const categories = ["dispatch", "signal", "launch", "build"] as const;
const windows = ["6h", "24h", "48h"] as const;

export const activityCategories = categories;
export const activityWindows = windows;

export type ActivityCategory = (typeof categories)[number];
export type ActivityWindow = (typeof windows)[number];
export type ActivityFilters = {
  category: ActivityCategory | "all";
  window: ActivityWindow;
  includeSeed: boolean;
};

const defaultFilters: ActivityFilters = {
  category: "all",
  window: "24h",
  includeSeed: true,
};

const windowInHours: Record<ActivityWindow, number> = {
  "6h": 6,
  "24h": 24,
  "48h": 48,
};

export const activityInputSchema = z.object({
  authorLabel: z.string().trim().min(2).max(32),
  category: z.enum(categories),
  text: z.string().trim().min(8).max(280),
  link: z
    .union([z.literal(""), z.string().trim().url()])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

const activityPayloadSchema = z.object({
  authorLabel: z.string(),
  category: z.enum(categories),
  text: z.string(),
  link: z.string().url().optional(),
});

export type ActivityInput = z.input<typeof activityInputSchema>;

export type Activity = z.infer<typeof activityPayloadSchema> & {
  arkivEntityKey: string;
  createdAt: number;
  creator: string | null;
  source: "arkiv" | "seed";
};

function pickSingleValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

export function normalizeActivityFilters(input?: {
  category?: string | string[] | null;
  window?: string | string[] | null;
  seed?: string | string[] | null;
}) {
  const category = pickSingleValue(input?.category);
  const window = pickSingleValue(input?.window);
  const seed = pickSingleValue(input?.seed);

  return {
    category:
      category && categories.includes(category as ActivityCategory)
        ? (category as ActivityCategory)
        : defaultFilters.category,
    window:
      window && windows.includes(window as ActivityWindow)
        ? (window as ActivityWindow)
        : defaultFilters.window,
    includeSeed: seed === "false" ? false : true,
  } satisfies ActivityFilters;
}

function getWindowCutoff(window: ActivityWindow, now = Date.now()) {
  return now - windowInHours[window] * 60 * 60 * 1000;
}

export function getSeedActivities(now = Date.now()): Activity[] {
  return [
    {
      arkivEntityKey: "seed-dispatch-01",
      authorLabel: "Braga Desk",
      category: "dispatch",
      text: "Seeded baseline activity so the feed stays useful before the first on-chain publish.",
      link: "https://explorer.braga.hoodi.arkiv.network/",
      createdAt: now - 35 * 60 * 1000,
      creator: null,
      source: "seed",
    },
    {
      arkivEntityKey: "seed-build-02",
      authorLabel: "Indexer Relay",
      category: "build",
      text: "The MVP now supports category and time-window filters on top of the shared project namespace.",
      createdAt: now - 5 * 60 * 60 * 1000,
      creator: null,
      source: "seed",
    },
    {
      arkivEntityKey: "seed-launch-03",
      authorLabel: "Ops Capsule",
      category: "launch",
      text: "A writer key will promote this feed from seeded preview to trusted Arkiv publishing without code changes.",
      createdAt: now - 22 * 60 * 60 * 1000,
      creator: null,
      source: "seed",
    },
    {
      arkivEntityKey: "seed-signal-04",
      authorLabel: "Signal Monitor",
      category: "signal",
      text: "Integration tests now cover filter normalization and the local seed fallback path.",
      createdAt: now - 38 * 60 * 60 * 1000,
      creator: null,
      source: "seed",
    },
  ];
}

export function filterActivities(
  activities: Activity[],
  filters: ActivityFilters,
  now = Date.now(),
) {
  const cutoff = getWindowCutoff(filters.window, now);

  return activities
    .filter((activity) => activity.createdAt >= cutoff)
    .filter((activity) =>
      filters.category === "all" ? true : activity.category === filters.category,
    )
    .sort((left, right) => right.createdAt - left.createdAt);
}

function readAttribute(
  entity: { attributes?: Array<{ key: string; value: string | number }> },
  key: string,
) {
  return entity.attributes?.find((attribute) => attribute.key === key)?.value ?? null;
}

function toActivity(entity: {
  key: string;
  toJson: () => unknown;
  attributes?: Array<{ key: string; value: string | number }>;
  metadata?: { creator?: string };
}) {
  try {
    const payload = activityPayloadSchema.parse(entity.toJson());
    const createdAt = readAttribute(entity, "created");

    if (typeof createdAt !== "number") {
      return null;
    }

    return {
      arkivEntityKey: entity.key,
      createdAt,
      creator: entity.metadata?.creator ?? null,
      source: "arkiv",
      ...payload,
    } satisfies Activity;
  } catch {
    return null;
  }
}

function toAuthorKey(authorLabel: string) {
  const normalized = authorLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);

  return normalized || "anonymous";
}

export async function fetchActivities(filtersInput?: {
  category?: string | string[] | null;
  window?: string | string[] | null;
  seed?: string | string[] | null;
}) {
  const filters = normalizeActivityFilters(filtersInput);
  const fallback = filters.includeSeed ? filterActivities(getSeedActivities(), filters) : [];

  try {
    const conditions = [
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq(ACTIVITY_ATTRIBUTE.key, ACTIVITY_ATTRIBUTE.value),
      gt("created", getWindowCutoff(filters.window)),
    ];

    if (filters.category !== "all") {
      conditions.push(eq("category", filters.category));
    }

    let query = publicClient
      .buildQuery()
      .where(conditions)
      .withPayload(true)
      .withAttributes(true)
      .withMetadata(true)
      .limit(24);

    if (trustedCreatorAddress) {
      query = query.createdBy(trustedCreatorAddress);
    }

    const result = await query.fetch();

    const activities: Activity[] = result.entities
      .flatMap((entity) => {
        const activity = toActivity(entity as never);

        return activity ? [activity] : [];
      })
      .sort((left, right) => right.createdAt - left.createdAt);

    return activities.length > 0 ? activities : fallback;
  } catch {
    return fallback;
  }
}

export async function createActivity(input: ActivityInput) {
  const writer = getWalletClient();

  if (!writer) {
    throw new Error("PRIVATE_KEY is not configured. Reads work, writes are disabled.");
  }

  const data = activityInputSchema.parse(input);
  const createdAt = Date.now();

  return writer.createEntity({
    payload: jsonToPayload({
      authorLabel: data.authorLabel,
      category: data.category,
      text: data.text,
      link: data.link,
    }),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      ACTIVITY_ATTRIBUTE,
      { key: "author", value: toAuthorKey(data.authorLabel) },
      { key: "category", value: data.category },
      { key: "created", value: createdAt },
    ],
    expiresIn: ExpirationTime.fromHours(24),
  });
}