import { createCoinCall, getCoinCreateFromLogs } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import type { Address, Hex } from "viem";
import type { CreateCoinParams } from "@/types/tokenize";

// Type for Zora SDK transaction parameters
interface ZoraTransactionParams {
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
export const TOKENIZE_FEE = "0.00001";

// Graph type to symbol suffix mapping
const GRAPH_TYPE_SUFFIXES: Record<string, string> = {
  mutuals: "MUT",
  attention: "ATT",
  influence: "INF",
};

/**
 * Generate coin name: username + graph type
 * Example: "0xd Mutuals", "dwr Attention", "vitalik Influence"
 */
export function generateCoinName(username: string, graphType: string): string {
  const suffix = graphType.toLowerCase().includes("attention")
    ? "Attention"
    : graphType.toLowerCase().includes("influence")
    ? "Influence"
    : "Mutuals";

  return `${username} ${suffix}`;
}

/**
 * Generate token symbol from username + graph type
 * Example: "0xd" + "mutuals" = "0XDMUT"
 */
export function generateSymbol(username: string, graphType: string): string {
  const typeKey = graphType.toLowerCase().includes("attention")
    ? "attention"
    : graphType.toLowerCase().includes("influence")
    ? "influence"
    : "mutuals";

  const suffix = GRAPH_TYPE_SUFFIXES[typeKey];
  const base = username.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const maxBase = 10 - suffix.length; // Zora symbols max 10 chars
  return base.slice(0, Math.max(3, maxBase)) + suffix;
}

/**
 * Prepare coin creation parameters for wagmi useSendTransaction
 * Returns raw transaction params: { to, data, value }
 */
export async function prepareCoinCreation(
  params: CreateCoinParams
): Promise<ZoraTransactionParams> {
  const coinParams = {
    creator: params.payoutRecipient, // Creator is the user
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
  // SDK returns array of transactions, take the first one
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

/**
 * Generate share text for social media
 */
export function getShareText(username: string, coinUrl: string): string {
  return `Just tokenized my Farcaster social graph! Check out my connections:\n\n${coinUrl}`;
}
