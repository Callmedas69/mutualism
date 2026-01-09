/**
 * MutualismNFT Contract Helpers
 *
 * Provides utilities for interacting with the MutualismNFT contract.
 * Uses wagmi for contract interactions.
 */

import { parseEther } from "viem";
import type { SnapshotView as SnapshotViewType } from "@/types/tokenize";
import {
  MUTUALISM_NFT_ADDRESS,
  MUTUALISM_NFT_ABI,
  SnapshotView as SnapshotViewEnum,
} from "@/abi/MutualismNFT";

// Fallback mint price (actual price is read from contract)
export const MUTUALISM_NFT_MINT_PRICE = "0.0001";

// Re-export for convenience
export {
  MUTUALISM_NFT_ADDRESS,
  MUTUALISM_NFT_ABI,
  SnapshotViewEnum,
};

// Type for the enum values
export type SnapshotViewEnumType = SnapshotViewEnum;

// ============================================
// Constants
// ============================================

/** Base chain ID */
export const BASE_CHAIN_ID = 8453;

/** Mint price in wei */
export const MINT_PRICE_WEI = parseEther(MUTUALISM_NFT_MINT_PRICE);

// ============================================
// View Type Mapping
// ============================================

/**
 * Maps frontend SnapshotView string to contract enum value
 */
export function mapViewToEnum(view: SnapshotViewType): SnapshotViewEnumType {
  switch (view) {
    case "mutual_circle":
      return SnapshotViewEnum.MUTUAL_CIRCLE;
    case "attention_circle":
      return SnapshotViewEnum.ATTENTION_CIRCLE;
    case "influence_circle":
      return SnapshotViewEnum.INFLUENCE_CIRCLE;
    default:
      throw new Error(`Unknown snapshot view: ${view}`);
  }
}

/**
 * Maps contract enum value to frontend SnapshotView string
 */
export function mapEnumToView(enumValue: SnapshotViewEnumType): SnapshotViewType {
  switch (enumValue) {
    case SnapshotViewEnum.MUTUAL_CIRCLE:
      return "mutual_circle";
    case SnapshotViewEnum.ATTENTION_CIRCLE:
      return "attention_circle";
    case SnapshotViewEnum.INFLUENCE_CIRCLE:
      return "influence_circle";
    default:
      throw new Error(`Unknown enum value: ${enumValue}`);
  }
}

/**
 * Gets display name for a snapshot view
 */
export function getViewDisplayName(view: SnapshotViewType): string {
  switch (view) {
    case "mutual_circle":
      return "Mutual Circle";
    case "attention_circle":
      return "Attention Circle";
    case "influence_circle":
      return "Influence Circle";
    default:
      return "Unknown";
  }
}

// ============================================
// URL Helpers
// ============================================

/**
 * Gets the OpenSea URL for an NFT
 */
export function getOpenSeaUrl(tokenId: bigint | number): string {
  if (!MUTUALISM_NFT_ADDRESS) {
    throw new Error("MUTUALISM_NFT_ADDRESS not configured");
  }
  return `https://opensea.io/assets/base/${MUTUALISM_NFT_ADDRESS}/${tokenId}`;
}

/**
 * Gets the BaseScan URL for a transaction
 */
export function getBaseScanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

/**
 * Gets the BaseScan URL for the NFT contract
 */
export function getBaseScanContractUrl(): string {
  if (!MUTUALISM_NFT_ADDRESS) {
    throw new Error("MUTUALISM_NFT_ADDRESS not configured");
  }
  return `https://basescan.org/address/${MUTUALISM_NFT_ADDRESS}`;
}

// ============================================
// Mint Parameters
// ============================================

export interface MintParams {
  view: SnapshotViewEnumType;
  fid: bigint;
  graphVersion: bigint;
  animationUrl: string;
}

/**
 * Prepares mint parameters for the contract call
 */
export function prepareMintParams(
  view: SnapshotViewType,
  fid: number,
  animationUrl: string
): MintParams {
  return {
    view: mapViewToEnum(view),
    fid: BigInt(fid),
    graphVersion: BigInt(1), // Current graph version
    animationUrl,
  };
}

// ============================================
// Validation
// ============================================

/**
 * Checks if the contract address is configured
 */
export function isContractConfigured(): boolean {
  return Boolean(MUTUALISM_NFT_ADDRESS && MUTUALISM_NFT_ADDRESS.length > 0);
}

/**
 * Validates that the contract address is configured
 * @throws Error if not configured
 */
export function requireContractConfigured(): void {
  if (!isContractConfigured()) {
    throw new Error(
      "MutualismNFT contract address not configured. Set NEXT_PUBLIC_MUTUALISM_NFT_ADDRESS in .env.local"
    );
  }
}
