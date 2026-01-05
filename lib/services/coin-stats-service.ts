import { getCoins } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

/**
 * Coin stats returned from Zora
 */
export interface CoinStats {
  address: string;
  name: string;
  symbol: string;
  image: string;
  marketCap: string;
  volume24h: string;
  uniqueHolders: number;
  priceChange24h: string;
  totalSupply: string;
  creatorAddress: string;
}

/**
 * Zora token data shape from SDK response
 */
interface ZoraToken {
  address?: string;
  name?: string;
  symbol?: string;
  mediaContent?: {
    previewImage?: {
      medium?: string;
    };
  };
  marketCap?: string;
  volume24h?: string;
  uniqueHolders?: number;
  marketCapDelta24h?: string;
  totalSupply?: string;
  creatorAddress?: string;
}

/**
 * Simple in-memory cache with TTL and LRU eviction
 */
const cache = new Map<string, { data: CoinStats[]; timestamp: number }>();
const CACHE_TTL = 60_000; // 60 seconds
const MAX_CACHE_SIZE = 100;

/**
 * Evict oldest entries when cache exceeds max size
 */
function evictOldestEntries(): void {
  if (cache.size <= MAX_CACHE_SIZE) return;

  const entries = Array.from(cache.entries()).sort(
    (a, b) => a[1].timestamp - b[1].timestamp
  );

  const targetSize = Math.floor(MAX_CACHE_SIZE * 0.8);
  const entriesToRemove = cache.size - targetSize;

  for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
    cache.delete(entries[i][0]);
  }
}

/**
 * Transform Zora token response to CoinStats
 */
function transformToCoinStats(token: ZoraToken): CoinStats {
  return {
    address: token.address || "",
    name: token.name || "",
    symbol: token.symbol || "",
    image: token.mediaContent?.previewImage?.medium || "",
    marketCap: token.marketCap || "0",
    volume24h: token.volume24h || "0",
    uniqueHolders: token.uniqueHolders || 0,
    priceChange24h: token.marketCapDelta24h || "0",
    totalSupply: token.totalSupply || "0",
    creatorAddress: token.creatorAddress || "",
  };
}

/**
 * Fetch coin stats for multiple addresses
 * - Caches results for 60 seconds
 * - Uses LRU eviction when cache is full
 */
export async function fetchCoinStats(
  addresses: string[]
): Promise<{ stats: CoinStats[]; cached: boolean }> {
  // Create cache key from sorted addresses
  const cacheKey = [...addresses].sort().join(",");
  const cached = cache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { stats: cached.data, cached: true };
  }

  // Fetch from Zora SDK
  const response = await getCoins({
    coins: addresses.map((addr) => ({
      collectionAddress: addr,
      chainId: base.id,
    })),
  });

  const tokens = response.data?.zora20Tokens || [];
  const stats = tokens.map(transformToCoinStats);

  // Update cache
  cache.set(cacheKey, { data: stats, timestamp: Date.now() });
  evictOldestEntries();

  return { stats, cached: false };
}
