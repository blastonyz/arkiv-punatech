import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";

import { env, isWriterConfigured } from "@/lib/arkiv-client/config";

export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "arkiv-activity-mvp-f7a2",
} as const;

export const ACTIVITY_ATTRIBUTE = {
  key: "entityType",
  value: "activity",
} as const;

export const BRAGA_CHAIN_ID = 60138453102;
export const BRAGA_EXPLORER_URL = "https://explorer.braga.hoodi.arkiv.network/";

const writerAccount = env.privateKey
  ? privateKeyToAccount(env.privateKey as `0x${string}`)
  : null;

export const trustedCreatorAddress = writerAccount?.address ?? null;

export const publicClient = createPublicClient({
  chain: braga,
  transport: http(env.arkivRpcUrl),
});

export function getWalletClient() {
  if (!writerAccount || !isWriterConfigured) {
    return null;
  }

  return createWalletClient({
    chain: braga,
    transport: http(env.arkivRpcUrl),
    account: writerAccount,
  });
}