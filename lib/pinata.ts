import type { CoinMetadata, IPFSUploadResponse } from "@/types/tokenize";

/**
 * Upload result with both IPFS URI and gateway URL
 */
export interface UploadResult {
  ipfsUri: string;
  gatewayUrl: string;
}

/**
 * Upload an image blob to IPFS via server API
 * Retries once on failure (network issues are common)
 */
export async function uploadImageToIPFS(
  blob: Blob,
  filename: string
): Promise<UploadResult> {
  const upload = async (): Promise<UploadResult> => {
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
  };

  // Simple retry: try once, wait 1s, try again
  try {
    return await upload();
  } catch (firstError) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      return await upload();
    } catch {
      throw firstError; // Throw original error
    }
  }
}

/**
 * Upload metadata JSON to IPFS via server API
 * Retries once on failure
 */
export async function uploadMetadataToIPFS(
  metadata: CoinMetadata
): Promise<string> {
  const upload = async (): Promise<string> => {
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
  };

  // Simple retry
  try {
    return await upload();
  } catch (firstError) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      return await upload();
    } catch {
      throw firstError;
    }
  }
}

/**
 * Generate metadata object for a graph
 */
export function generateMetadata(
  username: string,
  fid: number,
  graphType: string,
  nodeCount: number,
  imageUri: string
): CoinMetadata {
  return {
    name: `Mutual Graph of @${username}`,
    description: `A snapshot of Farcaster social graph via Quotient, showing how people are connected across the network.`,
    image: imageUri,
    properties: {
      category: "social",
      fid,
      graphType,
      nodeCount,
      generatedAt: new Date().toISOString().slice(0, 10),
      source: "Quotient API",
    },
  };
}
