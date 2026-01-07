import type { CoinMetadata, IPFSUploadResponse, SnapshotView, TimeWindow, SnapshotUploadResponse } from "@/types/tokenize";
import { withRetry } from "@/lib/utils/with-retry";

// ============================================
// Snapshot Upload (v1 - per PINATA_RESTRUCTURING.md)
// ============================================

/**
 * Parameters for snapshot upload
 */
export interface SnapshotUploadParams {
  imageBlob: Blob;
  fid: number;
  username: string;
  view: SnapshotView;
  timeWindow: TimeWindow;
}

/**
 * Upload a snapshot to IPFS as a folder (image.png + metadata.json)
 * Returns folder CID and metadata URI for tokenization
 */
async function uploadSnapshotInternal(
  params: SnapshotUploadParams
): Promise<SnapshotUploadResponse> {
  const formData = new FormData();
  formData.append("image", params.imageBlob, "image.png");
  formData.append("fid", String(params.fid));
  formData.append("username", params.username);
  formData.append("view", params.view);
  formData.append("timeWindow", params.timeWindow);

  const response = await fetch("/api/tokenize", {
    method: "POST",
    body: formData,
    headers: {
      "x-farcaster-fid": String(params.fid),
    },
  });

  if (!response.ok) {
    let errorMsg = "Failed to upload snapshot";
    try {
      const error = await response.json();
      errorMsg = error.error || errorMsg;
    } catch {
      // Response body was empty or not valid JSON
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Upload a snapshot with retry logic
 */
export async function uploadSnapshot(
  params: SnapshotUploadParams
): Promise<SnapshotUploadResponse> {
  return withRetry(() => uploadSnapshotInternal(params), { retries: 1, delayMs: 1000 });
}

// ============================================
// Legacy Functions (for backward compatibility)
// ============================================

/**
 * Upload result with both IPFS URI and gateway URL
 */
export interface UploadResult {
  ipfsUri: string;
  gatewayUrl: string;
}

/**
 * Upload an image blob to IPFS via server API (single attempt)
 */
async function uploadImage(blob: Blob, filename: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await fetch("/api/tokenize", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = "Failed to upload image";
    try {
      const error = await response.json();
      errorMsg = error.error || errorMsg;
    } catch {
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  const data: IPFSUploadResponse = await response.json();
  return {
    ipfsUri: data.ipfsUri,
    gatewayUrl: data.gatewayUrl || "",
  };
}

/**
 * Upload metadata JSON to IPFS via server API (single attempt)
 * @deprecated The new snapshot upload includes metadata automatically
 */
async function uploadMetadata(metadata: CoinMetadata): Promise<string> {
  const response = await fetch("/api/tokenize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ metadata }),
  });

  if (!response.ok) {
    let errorMsg = "Failed to upload metadata";
    try {
      const error = await response.json();
      errorMsg = error.error || errorMsg;
    } catch {
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  const data: IPFSUploadResponse = await response.json();
  return data.ipfsUri;
}

/**
 * Upload an image blob to IPFS with retry
 * Still used by ShareGraphButton for simple image uploads
 */
export async function uploadImageToIPFS(
  blob: Blob,
  filename: string
): Promise<UploadResult> {
  return withRetry(() => uploadImage(blob, filename), { retries: 1, delayMs: 1000 });
}

/**
 * @deprecated Use uploadSnapshot instead
 * Upload metadata JSON to IPFS with retry
 */
export async function uploadMetadataToIPFS(
  metadata: CoinMetadata
): Promise<string> {
  return withRetry(() => uploadMetadata(metadata), { retries: 1, delayMs: 1000 });
}
