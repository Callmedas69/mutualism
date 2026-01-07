/**
 * Create Snapshot Use Case
 *
 * Orchestrates the snapshot creation workflow.
 * Per CLAUDE.md: Business logic layer handles orchestration and decisions.
 */

import type { SnapshotView, TimeWindow, SnapshotUploadResponse } from "@/types/tokenize";
import { generateSnapshotMetadata, generateFolderName } from "@/lib/services/coin-generator";
import { uploadFileToIPFS, uploadFolderToIPFS, getGatewayUrl } from "@/lib/repositories/pinata";
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
 * Create a snapshot: upload to IPFS and record in database
 *
 * Workflow:
 * 1. Upload image to IPFS → get imageCid
 * 2. Generate metadata JSON with imageCid
 * 3. Upload folder (image + metadata) → get folderCid
 * 4. Insert pointer record into database
 * 5. Return CIDs and URIs
 */
export async function createSnapshot(
  params: CreateSnapshotParams
): Promise<CreateSnapshotResult> {
  const { imageFile, fid, username, view, timeWindow } = params;

  // Step 1: Upload image first to get CID (needed for metadata)
  const renamedImage = new File([imageFile], "image.png", { type: "image/png" });
  const imageResult = await uploadFileToIPFS(renamedImage);
  const imageCid = imageResult.cid;

  // Step 2: Generate metadata with image CID
  const metadata = generateSnapshotMetadata(username, fid, view, timeWindow, imageCid);
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: "application/json",
  });
  const metadataFile = new File([metadataBlob], "metadata.json", {
    type: "application/json",
  });

  // Step 3: Upload folder with both files
  const folderName = generateFolderName(view, fid, timeWindow);
  const imageForFolder = new File([imageFile], "image.png", { type: "image/png" });
  const folderResult = await uploadFolderToIPFS([imageForFolder, metadataFile], folderName);
  const folderCid = folderResult.cid;

  // Step 4: Insert database record (pointer only)
  const dbResult = await insertSnapshot({
    user_fid: fid,
    view,
    time_window: timeWindow,
    cid: folderCid,
  });

  // Step 5: Return result
  return {
    folderCid,
    imageCid,
    metadataUri: `ipfs://${folderCid}/metadata.json`,
    gatewayUrl: getGatewayUrl(folderCid),
    snapshotId: dbResult?.snapshot_id,
  };
}
