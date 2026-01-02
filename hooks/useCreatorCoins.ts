"use client";

import { useReadContract, useAccount } from "wagmi";
import { REGISTRY_ADDRESS, REGISTRY_ABI } from "@/lib/registry";
import { base } from "viem/chains";

/**
 * Hook to fetch coins created by the connected wallet
 * Queries the CoinRegistry contract on Base
 */
export function useCreatorCoins() {
  const { address, isConnected } = useAccount();

  const {
    data: coinAddresses,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "getCoinsByCreator",
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: isConnected && !!address && !!REGISTRY_ADDRESS,
    },
  });

  return {
    coinAddresses: coinAddresses as `0x${string}`[] | undefined,
    isLoading,
    error,
    refetch,
    isConnected,
  };
}
