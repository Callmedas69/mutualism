import { createCoinCall, getCoinCreateFromLogs } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import type { Address, Hex } from "viem";
import type { CreateCoinParams } from "@/types/tokenize";

// Type for Zora SDK transaction parameters
export interface ZoraTransactionParams {
  to: Address;
  data: Hex;
  value: bigint;
}

// Platform wallet addresses from environment
export const PLATFORM_WALLET = process.env
  .NEXT_PUBLIC_PLATFORM_WALLET as Address;
export const PLATFORM_REFERRER = process.env
  .NEXT_PUBLIC_PLATFORM_REFERRER as Address;

// Tokenization fee in ETH
export const TOKENIZE_FEE = "0.00015";

/**
 * Prepare coin creation parameters for wagmi useSendTransaction
 * Returns raw transaction params: { to, data, value }
 */
export async function prepareCoinCreation(
  params: CreateCoinParams
): Promise<ZoraTransactionParams> {
  const coinParams = {
    creator: params.payoutRecipient,
    name: params.name,
    symbol: params.symbol,
    metadata: {
      type: "RAW_URI" as const,
      uri: params.uri,
    },
    currency: "ETH" as const,
    payoutRecipientOverride: params.payoutRecipient,
    platformReferrer: params.platformReferrer || PLATFORM_REFERRER,
    chainId: base.id,
  };

  // Get contract call parameters from Zora SDK
  const result = await createCoinCall(coinParams);
  const txParams = result[0];

  return {
    to: txParams.to as Address,
    data: txParams.data as Hex,
    value: txParams.value,
  };
}

/**
 * Generate Zora coin URL from contract address
 */
export function getCoinUrl(coinAddress: Address): string {
  return `https://zora.co/coin/base:${coinAddress}`;
}

/**
 * Parse coin address from transaction receipt
 */
export function parseCoinAddressFromReceipt(
  receipt: { logs: readonly { topics: readonly string[]; data: string }[] }
): Address | null {
  try {
    const deployment = getCoinCreateFromLogs(receipt as any);
    return deployment?.coin || null;
  } catch {
    return null;
  }
}
