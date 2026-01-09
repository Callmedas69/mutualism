import { NextRequest, NextResponse } from "next/server";
import { getShareVerification } from "@/lib/repositories/share-verification";

/**
 * GET /api/farcaster/share-status?fid=123
 * Check if a user has verified their share
 */
export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "Missing fid" }, { status: 400 });
  }

  const fidNum = Number(fid);
  if (isNaN(fidNum) || fidNum <= 0) {
    return NextResponse.json({ error: "Invalid fid" }, { status: 400 });
  }

  const verification = await getShareVerification(fidNum);

  if (verification) {
    return NextResponse.json({
      verified: true,
      castHash: verification.castHash,
      castUrl: verification.castUrl,
    });
  }

  return NextResponse.json({ verified: false });
}
