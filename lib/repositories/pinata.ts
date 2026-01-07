/**
 * Pinata Repository
 *
 * Handles all IPFS/Pinata operations.
 * Per CLAUDE.md: Repository layer abstracts external APIs.
 * Repository is "dumb" - no business logic, just data access.
 */

import { PinataSDK } from "pinata";

// Initialize Pinata SDK (server-side only)
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

// ============================================
// Types
// ============================================

export interface UploadResult {
  cid: string;
  gatewayUrl: string;
}

// ============================================
// Repository Functions
// ============================================

/**
 * Upload a single file to IPFS
 */
export async function uploadFileToIPFS(file: File): Promise<UploadResult> {
  const upload = await pinata.upload.public.file(file);

  return {
    cid: upload.cid,
    gatewayUrl: `https://${PINATA_GATEWAY}/ipfs/${upload.cid}`,
  };
}

/**
 * Get gateway URL for a CID
 */
export function getGatewayUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}
