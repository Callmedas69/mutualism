import type { CoinMetadata, IPFSUploadResponse } from "@/types/tokenize";

/**
 * Upload an image blob to IPFS via server API
 * Retries once on failure (network issues are common)
 */
export async function uploadImageToIPFS(
  blob: Blob,
  filename: string
): Promise<string> {
  const upload = async (): Promise<string> => {
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
    return data.ipfsUri;
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
    description: `Farcaster social graph snapshot via Quotient. A visual representation of @${username}'s social connections on Farcaster.`,
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
