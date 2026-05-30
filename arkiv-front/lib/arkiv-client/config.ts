import { z } from "zod";

const defaultRpcUrl = "https://braga.hoodi.arkiv.network/rpc";

const envSchema = z.object({
  BRAGA_RPC_URL: z.string().url().default(defaultRpcUrl),
  BRAGA_PK: z
    .string()
    .regex(/^(0x)?[a-fA-F0-9]{64}$/, "BRAGA_PK must be a 32-byte hex string.")
    .optional(),
});

const parsed = envSchema.safeParse({
  BRAGA_RPC_URL: process.env.BRAGA_RPC_URL,
  BRAGA_PK: process.env.BRAGA_PK,
});

if (!parsed.success) {
  throw new Error(parsed.error.issues.map((issue) => issue.message).join("\n"));
}

function normalizeKey(key: string | undefined): `0x${string}` | null {
  if (!key) return null;
  return key.startsWith("0x") ? (key as `0x${string}`) : `0x${key}`;
}

export const env = {
  arkivRpcUrl: parsed.data.BRAGA_RPC_URL,
  privateKey: normalizeKey(parsed.data.BRAGA_PK),
};

export const isWriterConfigured = Boolean(env.privateKey);