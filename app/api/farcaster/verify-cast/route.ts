import { NextRequest, NextResponse } from "next/server";
import {
  getUserRecentCasts,
  findMatchingCast,
} from "@/lib/repositories/neynar";
import { upsertShareVerification } from "@/lib/repositories/share-verification";

export async function POST(request: NextRequest) {
  try {
    const { fid, searchText, imageUrl, maxAgeSeconds = 120 } = await request.json();

    // Validate required fields
    if (!fid || !searchText) {
      return NextResponse.json(
        { error: "Missing required fields: fid, searchText" },
        { status: 400 }
      );
    }

    // Fetch user's recent casts from Neynar
    const casts = await getUserRecentCasts(fid, 10);

    // Find matching cast by text and embed
    const matchingCast = findMatchingCast(
      casts,
      searchText,
      imageUrl || "",
      maxAgeSeconds * 1000
    );

    if (matchingCast) {
      const castUrl = `https://warpcast.com/${matchingCast.author.username}/${matchingCast.hash.slice(0, 10)}`;

      // Persist verification to Supabase (await to ensure it completes)
      const persisted = await upsertShareVerification(fid, matchingCast.hash, castUrl);
      if (!persisted) {
        console.error(`Failed to persist share verification for fid ${fid}`);
      }

      return NextResponse.json({
        verified: true,
        castHash: matchingCast.hash,
        castUrl,
        persisted, // Include persistence status in response
      });
    }

    return NextResponse.json({ verified: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Cast verification error:", errorMessage, error);
    return NextResponse.json(
      { error: "Verification failed", details: errorMessage },
      { status: 500 }
    );
  }
}
