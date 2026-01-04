import type { Address } from "viem";

/**
 * Metadata schema for Zora Coin (EIP-7572 compliant)
 */
export interface CoinMetadata {
  name: string;
  description: string;
  image: string; // ipfs://...
  properties: {
    category: "social";
    fid: number;
    graphType: string;
    nodeCount: number;
    generatedAt: string;
    source: "Quotient API";
  };
}

/**
 * Parameters for creating a Zora Coin
 */
export interface CreateCoinParams {
  name: string;
  symbol: string;
  uri: string; // IPFS metadata URI
  payoutRecipient: Address;
  platformReferrer?: Address;
}

/**
 * Graph data needed for tokenization
 */
export interface TokenizeGraphData {
  username: string;
  fid: number;
  nodeCount: number;
  graphType: string;
}

/**
 * Result from coin creation
 */
export interface CoinCreationResult {
  hash: `0x${string}`;
  coinAddress: Address;
  coinUrl: string;
}

/**
 * Tokenization step status
 */
export type TokenizeStep =
  | "preview"
  | "payment"
  | "uploading"
  | "creating"
  | "registering"
  | "success"
  | "error";

/**
 * IPFS upload response
 */
export interface IPFSUploadResponse {
  ipfsUri: string;
  gatewayUrl?: string;
}
