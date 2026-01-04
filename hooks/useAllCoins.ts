"use client";

import { useReadContract, useAccount } from "wagmi";
import { REGISTRY_ADDRESS, REGISTRY_ABI } from "@/lib/registry";
import { base } from "viem/chains";

export interface CoinWithCreator {
  coin: `0x${string}`;
  creator: `0x${string}`;
}

/**
 * Hook to fetch all registered coins with pagination
 * Sorts connected user's coins to the top
 */
export function useAllCoins(page: number, pageSize: number = 10) {
  const { address } = useAccount();
  const offset = page * pageSize;

  const { data, isLoading, error, refetch } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "getCoins",
    args: [BigInt(offset), BigInt(pageSize)],
    chainId: base.id,
    query: {
      enabled: !!REGISTRY_ADDRESS,
      gcTime: 5 * 60 * 1000, // 5 min cache retention
      staleTime: 30_000, // 30 sec fresh window
    },
  });

  // Parse return tuple
  const coins = data?.[0] as `0x${string}`[] | undefined;
  const creators = data?.[1] as `0x${string}`[] | undefined;
  const total = data?.[2] ? Number(data[2]) : 0;

  // Combine and sort: connected user's coins first
  const sortedData: CoinWithCreator[] =
    coins && creators
      ? coins
          .map((coin, i) => ({ coin, creator: creators[i] }))
          .sort((a, b) => {
            const aIsUser =
              a.creator.toLowerCase() === address?.toLowerCase();
            const bIsUser =
              b.creator.toLowerCase() === address?.toLowerCase();
            if (aIsUser && !bIsUser) return -1;
            if (!aIsUser && bIsUser) return 1;
            return 0;
          })
      : [];

  return {
    coins: sortedData,
    total,
    totalPages: Math.ceil(total / pageSize),
    isLoading,
    error,
    refetch,
  };
}
