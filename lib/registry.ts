import type { Address } from "viem";

/**
 * CoinRegistry contract address on Base
 * Deploy the contract and set this in .env.local
 */
export const REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_REGISTRY_ADDRESS as Address;

/**
 * CoinRegistry ABI - minimal contract for tracking created coins
 */
export const REGISTRY_ABI = [
  {
    name: "registerCoin",
    type: "function",
    inputs: [{ name: "coin", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "getCoinsByCreator",
    type: "function",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    name: "getCoinCount",
    type: "function",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "CoinRegistered",
    type: "event",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "coin", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
