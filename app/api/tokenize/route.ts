/**
 * POST /api/tokenize
 *
 * API Route (Controller Layer)
 * Per CLAUDE.md: Handles routing, validation, and delegation only.
 * No business logic or direct external API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import type { SnapshotView, TimeWindow, SnapshotUploadResponse } from "@/types/tokenize";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { createSnapshot } from "@/lib/usecases/create-snapshot";
import { uploadFileToIPFS } from "@/lib/repositories/pinata";

// ============================================
// Validation Helpers
// ============================================

const VALID_VIEWS: SnapshotView[] = ["mutual_circle", "attention_circle", "influence_circle"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface SnapshotRequestParams {
  fid: number;
  username: string;
  view: SnapshotView;
  timeWindow: TimeWindow;
  imageFile: File;
}

function validateSnapshotRequest(
  formData: FormData,
  imageFile: File
): { valid: true; params: SnapshotRequestParams } | { valid: false; error: string; status: number } {
  const fid = Number(formData.get("fid"));
  const username = formData.get("username") as string;
  const view = formData.get("view") as SnapshotView;
  const timeWindow = (formData.get("timeWindow") as TimeWindow) || "all_time";

  if (!fid || isNaN(fid)) {
    return { valid: false, error: "Invalid fid", status: 400 };
  }
  if (!username) {
    return { valid: false, error: "Missing username", status: 400 };
  }
  if (!VALID_VIEWS.includes(view)) {
    return { valid: false, error: "Invalid view", status: 400 };
  }
  if (!imageFile.type.startsWith("image/")) {
    return { valid: false, error: "Only image files allowed", status: 400 };
  }
  if (imageFile.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 10MB limit", status: 400 };
  }

  return {
    valid: true,
    params: { fid, username, view, timeWindow, imageFile },
  };
}

// ============================================
// Route Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Only handle FormData (multipart)
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type. Use multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const image = formData.get("image") as File | null;

    // Determine upload type based on form fields
    const isSnapshotUpload = image && formData.has("fid") && formData.has("view");

    if (isSnapshotUpload) {
      return handleSnapshotUpload(request, formData, image);
    } else if (file) {
      return handleSimpleUpload(file);
    }

    return NextResponse.json(
      { error: "No file or image provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in /api/tokenize:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

// ============================================
// Snapshot Upload Handler
// ============================================

async function handleSnapshotUpload(
  request: NextRequest,
  formData: FormData,
  imageFile: File
): Promise<NextResponse<SnapshotUploadResponse | { error: string }>> {
  // Step 1: Validate request
  const validation = validateSnapshotRequest(formData, imageFile);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { fid, username, view, timeWindow } = validation.params;

  // Step 2: Security - FID consistency check
  const headerFid = request.headers.get("x-farcaster-fid");
  if (headerFid && parseInt(headerFid) !== fid) {
    console.warn(`FID mismatch: header=${headerFid}, body=${fid}`);
    return NextResponse.json({ error: "FID mismatch" }, { status: 400 });
  }

  // Step 3: Security - Rate limiting
  const rateLimit = checkRateLimit(fid);
  if (!rateLimit.allowed) {
    console.warn(`Rate limit exceeded for fid=${fid}`);
    return NextResponse.json(
      { error: "Rate limit exceeded (5/hour). Try again later." },
      { status: 429 }
    );
  }

  // Step 4: Delegate to use case
  const result = await createSnapshot({
    imageFile,
    fid,
    username,
    view,
    timeWindow,
  });

  // Step 5: Return response
  return NextResponse.json({
    folderCid: result.folderCid,
    imageCid: result.imageCid,
    metadataUri: result.metadataUri,
    gatewayUrl: result.gatewayUrl,
  });
}

// ============================================
// Simple Upload Handler (Legacy)
// ============================================

async function handleSimpleUpload(
  file: File
): Promise<NextResponse<{ ipfsUri: string; gatewayUrl: string } | { error: string }>> {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 10MB limit" },
      { status: 400 }
    );
  }

  // Delegate to repository
  const result = await uploadFileToIPFS(file);

  return NextResponse.json({
    ipfsUri: `ipfs://${result.cid}`,
    gatewayUrl: result.gatewayUrl,
  });
}
