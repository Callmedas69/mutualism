/**
 * CoinRegistry contract configuration
 * Uses the deployed contract ABI from abi/CoinRegistry.ts
 */
import { COIN_REGISTRY_ADDRESS, COIN_REGISTRY_ABI } from "@/abi/CoinRegistry";
import type { Address } from "viem";

export const REGISTRY_ADDRESS = COIN_REGISTRY_ADDRESS;
export const REGISTRY_ABI = COIN_REGISTRY_ABI;

/**
 * Request a signature from the registry signing API
 * Returns the signature needed to register a coin
 */
export async function requestRegistrySignature(
  creator: Address,
  coin: Address
): Promise<`0x${string}` | null> {
  try {
    const response = await fetch("/api/registry/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator, coin }),
    });

    if (!response.ok) {
      console.error("Failed to get registry signature:", await response.text());
      return null;
    }

    const { signature } = await response.json();
    return signature as `0x${string}`;
  } catch (error) {
    console.error("Registry signature fetch failed:", error);
    return null;
  }
}
