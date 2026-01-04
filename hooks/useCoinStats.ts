"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Coin stats returned from API
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
 * Hook to fetch live coin stats from Zora via our API
 * @param addresses Array of coin contract addresses
 */
export function useCoinStats(addresses: string[] | undefined) {
  // Stabilize query key by sorting addresses to prevent cache misses
  const sortedKey = addresses ? [...addresses].sort().join(",") : "";

  return useQuery({
    queryKey: ["coinStats", sortedKey],
    queryFn: async (): Promise<CoinStats[]> => {
      if (!addresses || addresses.length === 0) {
        return [];
      }

      const response = await fetch("/api/coins/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch coin stats");
      }

      const data = await response.json();
      return data.stats || [];
    },
    enabled: !!addresses && addresses.length > 0,
    staleTime: 60_000, // 60 sec fresh window
    gcTime: 5 * 60 * 1000, // 5 min cache retention
    refetchInterval: 60_000, // Refresh every minute
    refetchOnWindowFocus: false, // Don't refetch on tab focus
    refetchOnReconnect: true, // Refetch on network reconnect
  });
}
