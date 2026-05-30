import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";

import { env, isWriterConfigured } from "@/lib/arkiv-client/config";

const writerAccount = env.privateKey ? privateKeyToAccount(env.privateKey) : null;

export const agentWalletAddress = writerAccount?.address ?? null;

export const publicClient = createPublicClient({
  chain: braga,
  transport: http(env.arkivRpcUrl),
});

export function getWalletClient() {
  if (!writerAccount || !isWriterConfigured) return null;
  return createWalletClient({
    chain: braga,
    transport: http(env.arkivRpcUrl),
    account: writerAccount,
  });
}

export { isWriterConfigured };
