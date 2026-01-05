"use client";

import { useState, useEffect } from "react";

const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
const CACHE_TTL = 60_000; // 1 minute

// Module-level cache to avoid refetching across components
let cachedPrice: number | null = null;
let cacheTimestamp = 0;

/**
 * Hook to fetch current ETH price in USD
 * - Caches result for 1 minute
 * - Gracefully handles errors (returns null)
 * - Shared cache across all component instances
 */
export function useEthPrice(): number | null {
  const [price, setPrice] = useState<number | null>(cachedPrice);

  useEffect(() => {
    // Return cached value if still valid
    if (cachedPrice !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
      setPrice(cachedPrice);
      return;
    }

    const controller = new AbortController();

    fetch(COINGECKO_API, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const ethPrice = data.ethereum?.usd ?? null;
        cachedPrice = ethPrice;
        cacheTimestamp = Date.now();
        setPrice(ethPrice);
      })
      .catch(() => {
        // Silently fail - price is optional UX enhancement
        setPrice(null);
      });

    return () => controller.abort();
  }, []);

  return price;
}

/**
 * Calculate USD value from ETH amount
 */
export function calculateUsdValue(ethAmount: string, ethPrice: number | null): string | null {
  if (!ethPrice) return null;
  return (parseFloat(ethAmount) * ethPrice).toFixed(2);
}
