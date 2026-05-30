export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "memoryforge-ai-punatech26",
} as const;

export const BRAGA_EXPLORER_URL = "https://explorer.braga.hoodi.arkiv.network/";
export const BRAGA_EXPLORER_ENTITY_URL = (key: string) =>
  `${BRAGA_EXPLORER_URL}entity/${key}`;
