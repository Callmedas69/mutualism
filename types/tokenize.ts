import type { Address } from "viem";

// ============================================
// Snapshot Types (v1 - per PINATA_RESTRUCTURING.md)
// ============================================

/**
 * Allowed snapshot view types
 */
export type SnapshotView = "mutual_circle" | "attention_circle" | "influence_circle";

/**
 * Allowed time windows for snapshots
 */
export type TimeWindow = "last_7d" | "last_30d" | "last_90d" | "all_time";

/**
 * Metadata schema for Mutualism snapshots (v1)
 * - A snapshot is immutable
 * - If anything changes, it is a new snapshot
 * - The PNG is the truth
 * - No analytics/metrics allowed
 */
export interface SnapshotMetadata {
  name: string;
  description: string;
  image: string; // ipfs://<PNG_CID>
  properties: {
    category: "mutualism";
    fid: number;
    view: SnapshotView;
    timeWindow: TimeWindow;
    generatedAt: string; // ISO 8601
    graphVersion: "v1";
    source: "Quotient API";
  };
}

/**
 * Response from snapshot upload
 */
export interface SnapshotUploadResponse {
  imageCid: string;
  metadataCid: string;
  metadataUri: string; // ipfs://{metadataCid}
  gatewayUrl: string;
}

// ============================================
// Legacy Types (for backward compatibility)
// ============================================

/**
 * @deprecated Use SnapshotMetadata instead
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
 * Note: nodeCount removed per PINATA_RESTRUCTURING.md (forbidden field)
 */
export interface TokenizeGraphData {
  username: string;
  fid: number;
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
