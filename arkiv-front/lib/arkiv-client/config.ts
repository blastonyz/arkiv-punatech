import { z } from "zod";

const defaultRpcUrl = "https://braga.hoodi.arkiv.network/rpc";

const envSchema = z.object({
  ARKIV_RPC_URL: z.string().url().default(defaultRpcUrl),
  PRIVATE_KEY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "PRIVATE_KEY must be a 32-byte hex string.")
    .optional(),
});

const parsed = envSchema.safeParse({
  ARKIV_RPC_URL: process.env.ARKIV_RPC_URL,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
});

if (!parsed.success) {
  throw new Error(parsed.error.issues.map((issue) => issue.message).join("\n"));
}

export const env = {
  arkivRpcUrl: parsed.data.ARKIV_RPC_URL,
  privateKey: parsed.data.PRIVATE_KEY ?? null,
};

export const isWriterConfigured = Boolean(env.privateKey);