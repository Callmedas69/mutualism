"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Coin stats returned from API
 */
export interface CoinStats {
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
 * Hook to fetch live coin stats from Zora via our API
 * @param addresses Array of coin contract addresses
 */
export function useCoinStats(addresses: string[] | undefined) {
  return useQuery({
    queryKey: ["coinStats", addresses],
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
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
  });
}
