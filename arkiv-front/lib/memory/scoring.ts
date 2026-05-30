/**
 * Utility score for a memory entry.
 * utilityScore = citationScore + humanFeedback + recencyBoost - contradictionPenalty
 * Reinforcement threshold: >= 80 → extend TTL 7 days
 * Promotion threshold: citationCount >= 3 + positive feedback → run→entity or entity→global
 */

export type HumanFeedback = "confirmed" | "none" | "incorrect";

const FEEDBACK_MAP: Record<HumanFeedback, number> = {
  confirmed: 20,
  none: 0,
  incorrect: -40,
};

export function computeUtilityScore(opts: {
  citationScore: number;        // 0-100
  humanFeedback: HumanFeedback;
  recencyBoost: number;         // 0-20, provided by caller based on lastUsedAt
  contradictionPenalty: number; // 0-30
}): number {
  const score =
    opts.citationScore +
    FEEDBACK_MAP[opts.humanFeedback] +
    opts.recencyBoost -
    opts.contradictionPenalty;

  return Math.max(0, Math.min(100, score));
}

export function shouldReinforce(utilityScore: number): boolean {
  return utilityScore >= 80;
}

export function shouldPromote(citationCount: number, humanFeedback: HumanFeedback): boolean {
  return citationCount >= 3 && humanFeedback === "confirmed";
}

export function nextScope(
  current: "run" | "entity" | "global" | "shared",
): "entity" | "global" | "shared" {
  if (current === "run") return "entity";
  if (current === "entity") return "global";
  return "shared";
}

/** Recency boost: full 20 if used < 1h ago, decays linearly to 0 at 48h */
export function recencyBoost(lastUsedAt: number, now = Date.now()): number {
  const hoursAgo = (now - lastUsedAt) / (1000 * 60 * 60);
  if (hoursAgo >= 48) return 0;
  return Math.round(20 * (1 - hoursAgo / 48));
}
