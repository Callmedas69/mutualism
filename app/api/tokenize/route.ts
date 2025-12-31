import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";
import type { CoinMetadata } from "@/types/tokenize";

// Initialize Pinata SDK (server-side only)
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle JSON metadata upload
    if (contentType.includes("application/json")) {
      const { metadata } = (await request.json()) as { metadata: CoinMetadata };

      if (!metadata || !metadata.name) {
        return NextResponse.json(
          { error: "Invalid metadata" },
          { status: 400 }
        );
      }

      // Create a JSON file from metadata
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      const metadataFile = new File([metadataBlob], "metadata.json", {
        type: "application/json",
      });

      const upload = await pinata.upload.public.file(metadataFile);
      const ipfsUri = `ipfs://${upload.cid}`;

      return NextResponse.json({
        ipfsUri,
        gatewayUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${upload.cid}`,
      });
    }

    // Handle FormData file upload (image)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image files are allowed" },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "File size exceeds 10MB limit" },
          { status: 400 }
        );
      }

      const upload = await pinata.upload.public.file(file);
      const ipfsUri = `ipfs://${upload.cid}`;

      return NextResponse.json({
        ipfsUri,
        gatewayUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${upload.cid}`,
      });
    }

    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    return NextResponse.json(
      { error: "Failed to upload to IPFS" },
      { status: 500 }
    );
  }
}
