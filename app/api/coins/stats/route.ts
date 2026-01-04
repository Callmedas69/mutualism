import { NextRequest, NextResponse } from "next/server";
import { getCoins } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

/**
 * Coin stats returned from Zora
 */
interface CoinStats {
  address: string;
  name: string;
  symbol: string;
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
  marketCap?: string;
  volume24h?: string;
  uniqueHolders?: number;
  marketCapDelta24h?: string;
  totalSupply?: string;
  creatorAddress?: string;
}

/**
 * Simple in-memory cache with TTL and proper LRU eviction
 * Key: comma-separated sorted addresses
 * Value: { data, timestamp }
 */
const cache = new Map<string, { data: CoinStats[]; timestamp: number }>();
const CACHE_TTL = 60_000; // 60 seconds
const MAX_CACHE_SIZE = 100;

/**
 * Evict oldest entries when cache exceeds max size
 */
function evictOldestEntries(): void {
  if (cache.size <= MAX_CACHE_SIZE) return;

  // Convert to array and sort by timestamp (oldest first)
  const entries = Array.from(cache.entries()).sort(
    (a, b) => a[1].timestamp - b[1].timestamp
  );

  // Remove oldest entries until we're at 80% capacity
  const targetSize = Math.floor(MAX_CACHE_SIZE * 0.8);
  const entriesToRemove = cache.size - targetSize;

  for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
    cache.delete(entries[i][0]);
  }
}

/**
 * POST /api/coins/stats
 * Body: { addresses: string[] }
 * Returns: CoinStats[]
 */
export async function POST(request: NextRequest) {
  try {
    const { addresses } = (await request.json()) as { addresses: string[] };

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: "addresses array is required" },
        { status: 400 }
      );
    }

    // Limit to prevent abuse
    if (addresses.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 addresses per request" },
        { status: 400 }
      );
    }

    // Create cache key from sorted addresses
    const cacheKey = [...addresses].sort().join(",");
    const cached = cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ stats: cached.data, cached: true });
    }

    // Fetch from Zora SDK - uses coins array format
    const response = await getCoins({
      coins: addresses.map((addr) => ({
        collectionAddress: addr,
        chainId: base.id,
      })),
    });

    const tokens = response.data?.zora20Tokens || [];

    // Map to our stats interface
    const stats: CoinStats[] = tokens.map((token: ZoraToken) => ({
      address: token.address || "",
      name: token.name || "",
      symbol: token.symbol || "",
      marketCap: token.marketCap || "0",
      volume24h: token.volume24h || "0",
      uniqueHolders: token.uniqueHolders || 0,
      priceChange24h: token.marketCapDelta24h || "0",
      totalSupply: token.totalSupply || "0",
      creatorAddress: token.creatorAddress || "",
    }));

    // Update cache
    cache.set(cacheKey, { data: stats, timestamp: Date.now() });

    // Cleanup old cache entries with proper LRU eviction
    evictOldestEntries();

    return NextResponse.json({ stats, cached: false });
  } catch (error) {
    console.error("Error fetching coin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin stats" },
      { status: 500 }
    );
  }
}
