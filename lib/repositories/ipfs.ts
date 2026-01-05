import type { CoinMetadata, IPFSUploadResponse } from "@/types/tokenize";
import { withRetry } from "@/lib/utils/with-retry";

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
    const error = await response.json();
    throw new Error(error.error || "Failed to upload image");
  }

  const data: IPFSUploadResponse = await response.json();
  return {
    ipfsUri: data.ipfsUri,
    gatewayUrl: data.gatewayUrl || "",
  };
}

/**
 * Upload metadata JSON to IPFS via server API (single attempt)
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
    const error = await response.json();
    throw new Error(error.error || "Failed to upload metadata");
  }

  const data: IPFSUploadResponse = await response.json();
  return data.ipfsUri;
}

/**
 * Upload an image blob to IPFS with retry
 */
export async function uploadImageToIPFS(
  blob: Blob,
  filename: string
): Promise<UploadResult> {
  return withRetry(() => uploadImage(blob, filename), { retries: 1, delayMs: 1000 });
}

/**
 * Upload metadata JSON to IPFS with retry
 */
export async function uploadMetadataToIPFS(
  metadata: CoinMetadata
): Promise<string> {
  return withRetry(() => uploadMetadata(metadata), { retries: 1, delayMs: 1000 });
}
