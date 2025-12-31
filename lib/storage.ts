import type { Address } from "viem";

export interface CreatedCoin {
  coinAddress: Address;
  name: string;
  symbol: string;
  username: string;
  fid: number;
  graphType: string;
  nodeCount: number;
  createdAt: string;
  txHash: string;
}

const STORAGE_KEY = "quotient_created_coins";

/**
 * Get all created coins from localStorage
 */
export function getCreatedCoins(): CreatedCoin[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a newly created coin to localStorage
 */
export function saveCreatedCoin(coin: CreatedCoin): void {
  if (typeof window === "undefined") return;

  const coins = getCreatedCoins();

  // Avoid duplicates
  if (coins.some((c) => c.coinAddress === coin.coinAddress)) return;

  // Add new coin at the beginning (most recent first)
  coins.unshift(coin);

  // Keep only last 50 coins
  const trimmed = coins.slice(0, 50);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Get coins created by a specific user (by FID)
 */
export function getCoinsByFid(fid: number): CreatedCoin[] {
  return getCreatedCoins().filter((c) => c.fid === fid);
}
