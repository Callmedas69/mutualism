/**
 * Create Snapshot Use Case
 *
 * Orchestrates the snapshot creation workflow.
 * Per CLAUDE.md: Business logic layer handles orchestration and decisions.
 */

import type { SnapshotView, TimeWindow, SnapshotUploadResponse } from "@/types/tokenize";
import { generateSnapshotMetadata, generateSnapshotBaseName } from "@/lib/services/coin-generator";
import { uploadFileToIPFS, getGatewayUrl } from "@/lib/repositories/pinata";
import { insertSnapshot } from "@/lib/repositories/snapshot-index";

// ============================================
// Types
// ============================================

export interface CreateSnapshotParams {
  imageFile: File;
  fid: number;
  username: string;
  view: SnapshotView;
  timeWindow: TimeWindow;
}

export interface CreateSnapshotResult extends SnapshotUploadResponse {
  snapshotId?: string;
}

// ============================================
// Use Case
// ============================================

/**
 * Create a snapshot: upload image and metadata to IPFS, record in database
 *
 * Workflow:
 * 1. Generate base name for files
 * 2. Upload image to IPFS → get imageCid
 * 3. Generate metadata JSON with imageCid
 * 4. Upload metadata to IPFS → get metadataCid
 * 5. Insert pointer record into database
 * 6. Return CIDs and URIs
 */
export async function createSnapshot(
  params: CreateSnapshotParams
): Promise<CreateSnapshotResult> {
  const { imageFile, fid, username, view, timeWindow } = params;

  // Step 1: Generate base name for files
  const baseName = generateSnapshotBaseName(view, fid, timeWindow);

  // Step 2: Upload image with naming convention
  const namedImage = new File([imageFile], `${baseName}.jpg`, { type: "image/jpeg" });
  const imageResult = await uploadFileToIPFS(namedImage);
  const imageCid = imageResult.cid;

  // Step 3: Generate metadata with image CID
  const metadata = generateSnapshotMetadata(username, fid, view, timeWindow, imageCid);
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: "application/json",
  });
  const metadataFile = new File([metadataBlob], `${baseName}.json`, {
    type: "application/json",
  });

  // Step 4: Upload metadata with naming convention
  const metadataResult = await uploadFileToIPFS(metadataFile);
  const metadataCid = metadataResult.cid;

  // Step 5: Insert database record (pointer to metadata CID)
  const dbResult = await insertSnapshot({
    user_fid: fid,
    view,
    time_window: timeWindow,
    cid: metadataCid,
  });

  // Step 6: Return result
  return {
    imageCid,
    metadataCid,
    metadataUri: `ipfs://${metadataCid}`,
    gatewayUrl: getGatewayUrl(imageCid),
    snapshotId: dbResult?.snapshot_id,
  };
}
