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

      // Persist verification to Supabase (fire and forget, don't block response)
      upsertShareVerification(fid, matchingCast.hash, castUrl).catch((err) =>
        console.error("Failed to persist share verification:", err)
      );

      return NextResponse.json({
        verified: true,
        castHash: matchingCast.hash,
        castUrl,
      });
    }

    return NextResponse.json({ verified: false });
  } catch (error) {
    console.error("Cast verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
